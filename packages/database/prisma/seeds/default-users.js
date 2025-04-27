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
  
  // Enhanced provider data with new fields
  const enhancedProviderData = {
    organizationName: 'Sample Medical Practice',
    phone: '555-123-4567',
    website: 'https://samplepractice.com',
    bio: 'A leading medical practice dedicated to providing quality care for over 20 years. Our team of board-certified physicians and medical professionals is committed to delivering comprehensive healthcare services with compassion and expertise.',
    logoUrl: 'https://placehold.co/400x400?text=SMP',
    address: '123 Main Street',
    city: 'Anytown',
    state: 'CA',
    zipCode: '90210',
    subscriptionStatus: 'ACTIVE',
    subscriptionTier: 'BASIC',
    
    // New fields for public provider pages
    specialties: [
      "Primary Care", 
      "Family Medicine", 
      "Pediatrics", 
      "Internal Medicine", 
      "Preventive Medicine"
    ],
    services: [
      "Annual Physical Exams",
      "Preventive Care",
      "Chronic Disease Management",
      "Vaccinations",
      "Minor Surgical Procedures",
      "Telehealth Appointments",
      "Lab Services"
    ],
    mission: "Our mission is to provide accessible, patient-centered healthcare that improves the quality of life for our community members at every stage of life.",
    email: "info@samplepractice.com",
    yearEstablished: 2003,
    licensingInfo: "All physicians are board-certified by the American Board of Medical Specialties and licensed by the California Medical Board.",
    insuranceAccepted: [
      "Aetna",
      "Blue Cross Blue Shield",
      "Cigna",
      "Humana",
      "Medicare",
      "Medicaid",
      "UnitedHealthcare"
    ],
    reviewCount: 157,
    rating: 4.8
  };

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
      
      // Provider data with enhanced fields
      providerData: enhancedProviderData,
      
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
          subscriptionPlan: 'BASIC',
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
