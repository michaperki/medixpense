// apps/api/src/services/stripe.js
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create a new Stripe customer
export async function createCustomer(provider) {
  try {
    const customer = await stripe.customers.create({
      email: provider.user.email,
      name: provider.organizationName,
      metadata: {
        providerId: provider.id
      }
    });
    
    // Update provider with Stripe customer ID
    await prisma.provider.update({
      where: { id: provider.id },
      data: { stripeCustomerId: customer.id }
    });
    
    return customer;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw error;
  }
}

// Create a subscription for a provider
export async function createSubscription(providerId, priceId) {
  try {
    // Get provider with customer ID
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      include: { user: true }
    });
    
    if (!provider) {
      throw new Error('Provider not found');
    }
    
    // Create Stripe customer if not exists
    let customerId = provider.stripeCustomerId;
    if (!customerId) {
      const customer = await createCustomer(provider);
      customerId = customer.id;
    }
    
    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        providerId: provider.id
      }
    });
    
    // Update provider subscription status
    await prisma.provider.update({
      where: { id: provider.id },
      data: {
        subscriptionStatus: 'ACTIVE',
        subscriptionTier: getPlanTypeFromPrice(priceId)
      }
    });
    
    return subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

// Cancel a subscription
export async function cancelSubscription(providerId) {
  try {
    // Get provider with subscription info
    const provider = await prisma.provider.findUnique({
      where: { id: providerId }
    });
    
    if (!provider || !provider.stripeSubscriptionId) {
      throw new Error('No active subscription found');
    }
    
    // Cancel subscription in Stripe
    const canceledSubscription = await stripe.subscriptions.cancel(
      provider.stripeSubscriptionId
    );
    
    // Update provider subscription status
    await prisma.provider.update({
      where: { id: provider.id },
      data: {
        subscriptionStatus: 'INACTIVE'
      }
    });
    
    return canceledSubscription;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

// Helper function to determine plan type from price ID
function getPlanTypeFromPrice(priceId) {
  const priceToPlan = {
    'price_basic': 'BASIC',
    'price_professional': 'PROFESSIONAL',
    'price_enterprise': 'ENTERPRISE'
  };
  
  return priceToPlan[priceId] || 'BASIC';
}

// Handle Stripe webhook events
export async function handleWebhookEvent(event) {
  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
    }
  } catch (error) {
    console.error('Error handling webhook event:', error);
    throw error;
  }
}

// Handle subscription updated
async function handleSubscriptionUpdated(subscription) {
  // Find provider by customer ID
  const provider = await prisma.provider.findFirst({
    where: { stripeCustomerId: subscription.customer }
  });
  
  if (!provider) return;
  
  // Update provider subscription status
  await prisma.provider.update({
    where: { id: provider.id },
    data: {
      subscriptionStatus: subscription.status === 'active' ? 'ACTIVE' : 
                          subscription.status === 'past_due' ? 'PAST_DUE' : 'INACTIVE',
      stripeSubscriptionId: subscription.id
    }
  });
}

// Handle subscription deleted
async function handleSubscriptionDeleted(subscription) {
  // Find provider by customer ID
  const provider = await prisma.provider.findFirst({
    where: { stripeCustomerId: subscription.customer }
  });
  
  if (!provider) return;
  
  // Update provider subscription status
  await prisma.provider.update({
    where: { id: provider.id },
    data: {
      subscriptionStatus: 'INACTIVE',
      stripeSubscriptionId: null
    }
  });
}

// Handle payment failed
async function handlePaymentFailed(invoice) {
  // Find provider by customer ID
  const provider = await prisma.provider.findFirst({
    where: { stripeCustomerId: invoice.customer }
  });
  
  if (!provider) return;
  
  // Update provider subscription status
  await prisma.provider.update({
    where: { id: provider.id },
    data: {
      subscriptionStatus: 'PAST_DUE'
    }
  });
}
