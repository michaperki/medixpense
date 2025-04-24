// packages/database/prisma/seeds/subscription-tiers.js
const subscriptionTiers = [
  {
    name: 'FREE',
    description: 'Basic access with limited features',
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      'Single location',
      'Basic procedure listing',
      'Standard support'
    ]
  },
  {
    name: 'BASIC',
    description: 'Essential features for small practices',
    monthlyPrice: 29.99,
    annualPrice: 299.99,
    features: [
      'Up to 3 locations',
      'Full procedure management',
      'Priority support',
      'Basic analytics'
    ]
  },
  {
    name: 'PREMIUM',
    description: 'Complete solution for growing practices',
    monthlyPrice: 79.99,
    annualPrice: 799.99,
    features: [
      'Unlimited locations',
      'Advanced analytics',
      'Premium support',
      'Custom branding',
      'API access'
    ]
  }
];

module.exports = { subscriptionTiers };
