// apps/api/src/controllers/settingsController.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

const prisma = new PrismaClient();

/**
 * GET /api/settings/provider
 * Get the current provider's settings
 */
export async function getProviderSettings(req, res) {
  try {
    const userId = req.user.id;
    
    // Get provider settings
    const settings = await prisma.providerSettings.findUnique({
      where: { userId }
    });
    
    if (!settings) {
      // Return default settings if none exist
      return res.json({
        general: {
          language: 'en',
          timeZone: 'UTC',
          dateFormat: 'MM/DD/YYYY'
        },
        notifications: {
          emailNotifications: true,
          smsNotifications: false,
          marketingEmails: false
        },
        security: {
          twoFactorEnabled: false,
          sessionTimeout: 30
        },
        billing: {
          subscriptionPlan: 'FREE',
          autoRenew: true
        }
      });
    }
    
    // Parse settings from JSON stored in DB
    const parsedSettings = {
      general: settings.general ? JSON.parse(settings.general) : {
        language: 'en',
        timeZone: 'UTC',
        dateFormat: 'MM/DD/YYYY'
      },
      notifications: settings.notifications ? JSON.parse(settings.notifications) : {
        emailNotifications: true,
        smsNotifications: false,
        marketingEmails: false
      },
      security: settings.security ? JSON.parse(settings.security) : {
        twoFactorEnabled: false,
        sessionTimeout: 30
      },
      billing: settings.billing ? JSON.parse(settings.billing) : {
        subscriptionPlan: 'FREE',
        autoRenew: true
      }
    };
    
    res.json(parsedSettings);
  } catch (err) {
    console.error('Error fetching provider settings:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * PUT /api/settings/provider
 * Update the current provider's settings
 */
export async function updateProviderSettings(req, res) {
  try {
    const userId = req.user.id;
    const { settingsType, ...data } = req.body;
    
    if (!['general', 'notifications', 'security', 'billing'].includes(settingsType)) {
      return res.status(400).json({ message: 'Invalid settings type' });
    }
    
    // Get existing settings
    let settings = await prisma.providerSettings.findUnique({
      where: { userId }
    });
    
    // Create settings record if it doesn't exist
    if (!settings) {
      settings = await prisma.providerSettings.create({
        data: {
          userId,
          general: JSON.stringify({
            language: 'en',
            timeZone: 'UTC',
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
            subscriptionPlan: 'FREE',
            autoRenew: true
          })
        }
      });
    }
    
    // Parse existing settings
    const parsedSettings = {
      general: settings.general ? JSON.parse(settings.general) : {
        language: 'en',
        timeZone: 'UTC',
        dateFormat: 'MM/DD/YYYY'
      },
      notifications: settings.notifications ? JSON.parse(settings.notifications) : {
        emailNotifications: true,
        smsNotifications: false,
        marketingEmails: false
      },
      security: settings.security ? JSON.parse(settings.security) : {
        twoFactorEnabled: false,
        sessionTimeout: 30
      },
      billing: settings.billing ? JSON.parse(settings.billing) : {
        subscriptionPlan: 'FREE',
        autoRenew: true
      }
    };
    
    // Update the specific settings type
    parsedSettings[settingsType] = {
      ...parsedSettings[settingsType],
      ...data
    };
    
    // Save updated settings
    const updatedSettings = await prisma.providerSettings.update({
      where: { userId },
      data: {
        [settingsType]: JSON.stringify(parsedSettings[settingsType])
      }
    });
    
    // Return parsed settings
    res.json(parsedSettings);
  } catch (err) {
    console.error('Error updating provider settings:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * POST /api/settings/change-password
 * Change user password
 */
export async function changePassword(req, res) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!validPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword }
    });
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * POST /api/settings/two-factor/enable
 * Enable two-factor authentication
 */
export async function enableTwoFactor(req, res) {
  try {
    const userId = req.user.id;
    
    // Generate a secret
    const secret = speakeasy.generateSecret({ 
      name: `Medixpense:${req.user.email}` 
    });
    
    // Store the secret
    await prisma.user.update({
      where: { id: userId },
      data: { 
        twoFactorSecret: secret.base32,
        twoFactorEnabled: false // Not enabled until verified
      }
    });
    
    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
    
    res.json({
      setupCode: qrCodeUrl
    });
  } catch (err) {
    console.error('Error enabling two-factor authentication:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * POST /api/settings/two-factor/verify
 * Verify and complete two-factor setup
 */
export async function verifyTwoFactor(req, res) {
  try {
    const userId = req.user.id;
    const { code } = req.body;
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ message: 'Two-factor setup not initiated' });
    }
    
    // Verify the code
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code
    });
    
    if (!verified) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }
    
    // Enable two-factor
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true }
    });
    
    // Update settings
    await updateSecuritySetting(userId, 'twoFactorEnabled', true);
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error verifying two-factor authentication:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * POST /api/settings/two-factor/disable
 * Disable two-factor authentication
 */
export async function disableTwoFactor(req, res) {
  try {
    const userId = req.user.id;
    
    // Disable two-factor
    await prisma.user.update({
      where: { id: userId },
      data: { 
        twoFactorEnabled: false,
        twoFactorSecret: null
      }
    });
    
    // Update settings
    await updateSecuritySetting(userId, 'twoFactorEnabled', false);
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error disabling two-factor authentication:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Helper function to update security settings
async function updateSecuritySetting(userId, key, value) {
  const settings = await prisma.providerSettings.findUnique({
    where: { userId }
  });
  
  if (!settings) return;
  
  const security = settings.security ? JSON.parse(settings.security) : {
    twoFactorEnabled: false,
    sessionTimeout: 30
  };
  
  security[key] = value;
  
  await prisma.providerSettings.update({
    where: { userId },
    data: { security: JSON.stringify(security) }
  });
}
