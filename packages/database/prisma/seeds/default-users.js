// packages/database/prisma/seeds/default-users.js
const bcrypt = require('bcrypt');
const { adminSettings } = require('./admin-settings');

// Helper function to hash passwords
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

// Function to create default users
async function createDefaultUsers() {
  // Generate password hash for 'password123'
  const password = 'password123';
  const passwordHash = await hashPassword(password);
  console.log('Generated hash for password123:', passwordHash);
  
  // Default users with providers and settings
  const defaultUsers = [
    {
      email: 'admin@medixpense.com',
      passwordHash: passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      status: 'ACTIVE',
      phone: '555-111-0000',
      
      // Admin settings data
      adminSettingsData: adminSettings
    },
    {
      email: 'provider@medixpense.com',
      passwordHash: passwordHash,
      firstName: 'Provider',
      lastName: 'User',
      role: 'PROVIDER',
      status: 'ACTIVE',
      phone: '555-222-0000',
      
      // Provider data
      providerData: {
        organizationName: 'Sample Medical Practice',
        phone: '555-123-4567',
        website: 'https://samplepractice.com',
        bio: 'A leading medical practice dedicated to providing quality care.',
        address: '123 Main Street',
        city: 'Anytown',
        state: 'CA',
        zipCode: '90210',
        subscriptionStatus: 'ACTIVE',  // Explicitly set to ACTIVE
        subscriptionTier: 'BASIC'      // Match the subscription plan
      },
      
      // Provider settings data
      settingsData: {
        general: JSON.stringify({
          language: 'en',
          timeZone: 'America/Los_Angeles',
          dateFormat: 'MM/DD/YYYY'
        }),
        notifications: JSON.stringify({
          emailNotifications: true,
          smsNotifications: false,
          marketingEmails: false
        }),
        security: JSON.stringify({
          twoFactorEnabled: false,
          sessionTimeout: 30
        }),
        billing: JSON.stringify({
          subscriptionPlan: 'BASIC',  // Updated from FREE to match active subscription
          autoRenew: true
        })
      }
    },
    {
      email: 'user@medixpense.com',
      passwordHash: passwordHash,
      firstName: 'Regular',
      lastName: 'User',
      role: 'USER',
      status: 'ACTIVE',
      phone: '555-333-0000'
    }
  ];
  
  return defaultUsers;
}

module.exports = {
  createDefaultUsers,
  hashPassword
};
