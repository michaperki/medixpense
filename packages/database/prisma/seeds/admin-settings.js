// packages/database/prisma/seeds/admin-settings.js
const adminSettings = {
  dashboard: JSON.stringify({
    defaultView: 'statistics',
    refreshRate: 5, // minutes
    visibleWidgets: ['users', 'providers', 'procedures', 'subscriptions']
  }),
  notifications: JSON.stringify({
    emailAlerts: true,
    systemAlerts: true,
    userRegistrations: true,
    subscriptionChanges: true
  }),
  security: JSON.stringify({
    twoFactorRequired: true,
    passwordPolicy: {
      minLength: 10,
      requireUppercase: true,
      requireNumber: true,
      requireSpecial: true,
      expiryDays: 90
    },
    sessionTimeout: 60 // minutes
  })
};

module.exports = { adminSettings };
