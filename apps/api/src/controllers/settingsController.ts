
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { prisma } from '@packages/database';

type SettingsType = 'general' | 'notifications' | 'security' | 'billing';
type ParsedSettings = {
  general: any;
  notifications: any;
  security: any;
  billing: any;
};

export async function getProviderSettings(req: Request, res: Response): Promise<Response> {
  try {
    const userId = req.user.id;

    const settings = await prisma.providerSettings.findUnique({
      where: { userId }
    });

    const parsedSettings: ParsedSettings = {
      general: settings?.general ? JSON.parse(settings.general) : { language: 'en', timeZone: 'UTC', dateFormat: 'MM/DD/YYYY' },
      notifications: settings?.notifications ? JSON.parse(settings.notifications) : { emailNotifications: true, smsNotifications: false, marketingEmails: false },
      security: settings?.security ? JSON.parse(settings.security) : { twoFactorEnabled: false, sessionTimeout: 30 },
      billing: settings?.billing ? JSON.parse(settings.billing) : { subscriptionPlan: 'FREE', autoRenew: true }
    };

    return res.json(parsedSettings);
  } catch (err) {
    console.error('Error fetching provider settings:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function updateProviderSettings(req: Request, res: Response): Promise<Response> {
  try {
    const userId = req.user.id;
    const settingsType = req.body.settingsType as SettingsType;
    const data = req.body.data ?? req.body;

    if (!['general', 'notifications', 'security', 'billing'].includes(settingsType)) {
      return res.status(400).json({ message: 'Invalid settings type' });
    }

    let settings = await prisma.providerSettings.findUnique({
      where: { userId }
    });

    if (!settings) {
      settings = await prisma.providerSettings.create({
        data: {
          userId,
          general: JSON.stringify({ language: 'en', timeZone: 'UTC', dateFormat: 'MM/DD/YYYY' }),
          notifications: JSON.stringify({ emailNotifications: true, smsNotifications: false, marketingEmails: false }),
          security: JSON.stringify({ twoFactorEnabled: false, sessionTimeout: 30 }),
          billing: JSON.stringify({ subscriptionPlan: 'FREE', autoRenew: true })
        }
      });
    }

    const parsedSettings: ParsedSettings = {
      general: settings.general ? JSON.parse(settings.general) : { language: 'en', timeZone: 'UTC', dateFormat: 'MM/DD/YYYY' },
      notifications: settings.notifications ? JSON.parse(settings.notifications) : { emailNotifications: true, smsNotifications: false, marketingEmails: false },
      security: settings.security ? JSON.parse(settings.security) : { twoFactorEnabled: false, sessionTimeout: 30 },
      billing: settings.billing ? JSON.parse(settings.billing) : { subscriptionPlan: 'FREE', autoRenew: true }
    };

    parsedSettings[settingsType] = {
      ...parsedSettings[settingsType],
      ...data
    };

    await prisma.providerSettings.update({
      where: { userId },
      data: {
        [settingsType]: JSON.stringify(parsedSettings[settingsType])
      }
    });

    return res.json(parsedSettings);
  } catch (err) {
    console.error('Error updating provider settings:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function changePassword(req: Request, res: Response): Promise<Response> {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!validPassword) return res.status(400).json({ message: 'Current password is incorrect' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword }
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('Error changing password:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function enableTwoFactor(req: Request, res: Response): Promise<Response> {
  try {
    const userId = req.user.id;

    const secret = speakeasy.generateSecret({ name: `Medixpense:${req.user.email}` });

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32, twoFactorEnabled: false }
    });

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    return res.json({ setupCode: qrCodeUrl });
  } catch (err) {
    console.error('Error enabling two-factor authentication:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function verifyTwoFactor(req: Request, res: Response): Promise<Response> {
  try {
    const userId = req.user.id;
    const { code } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ message: 'Two-factor setup not initiated' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true }
    });

    await updateSecuritySetting(userId, 'twoFactorEnabled', true);

    return res.json({ success: true });
  } catch (err) {
    console.error('Error verifying two-factor authentication:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function disableTwoFactor(req: Request, res: Response): Promise<Response> {
  try {
    const userId = req.user.id;

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null }
    });

    await updateSecuritySetting(userId, 'twoFactorEnabled', false);

    return res.json({ success: true });
  } catch (err) {
    console.error('Error disabling two-factor authentication:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function updateSecuritySetting(userId: string, key: string, value: boolean): Promise<void> {
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

