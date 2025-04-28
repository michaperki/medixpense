import { Request, Response } from 'express';
import { uploadToS3, getPublicUrl } from '../services/aws';
import { prisma } from '@packages/database';

/**
 * GET /api/profile/provider
 * Get the current provider's profile
 */
export async function getProviderProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;

    const provider = await prisma.provider.findUnique({
      where: { userId }
    });

    if (!provider) {
      res.status(404).json({ message: 'Provider profile not found' });
      return;
    }

    res.json(provider);
  } catch (err) {
    console.error('Error fetching provider profile:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * PUT /api/profile/provider
 * Update the current provider's profile
 */
export async function updateProviderProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const {
      organizationName,
      bio,
      phone,
      website,
      address,
      city,
      state,
      zipCode
    } = req.body;

    const existingProvider = await prisma.provider.findUnique({
      where: { userId }
    });

    if (!existingProvider) {
      res.status(404).json({ message: 'Provider profile not found' });
      return;
    }

    const updatedProvider = await prisma.provider.update({
      where: { userId },
      data: {
        organizationName,
        bio,
        phone,
        website,
        address,
        city,
        state,
        zipCode
      }
    });

    if (phone) {
      await prisma.user.update({
        where: { id: userId },
        data: { phone }
      });
    }

    res.json(updatedProvider);
  } catch (err) {
    console.error('Error updating provider profile:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * POST /api/profile/provider/logo
 * Upload provider logo
 */
export async function uploadProviderLogo(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const userId = req.user?.id;

    const provider = await prisma.provider.findUnique({
      where: { userId }
    });

    if (!provider) {
      res.status(404).json({ message: 'Provider profile not found' });
      return;
    }

    const filename = `provider-logos/${userId}-${Date.now()}-${req.file.originalname}`;
    await uploadToS3(req.file.buffer, filename, req.file.mimetype);
    const logoUrl = getPublicUrl(filename);

    await prisma.provider.update({
      where: { userId },
      data: { logoUrl }
    });

    res.json({ logoUrl });
  } catch (err) {
    console.error('Error uploading provider logo:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * GET /api/profile/provider/:providerId/public
 * Get public provider profile
 */
export async function getPublicProviderProfile(req: Request, res: Response): Promise<void> {
  try {
    const { providerId } = req.params;

    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: {
        id: true,
        organizationName: true,
        bio: true,
        website: true,
        phone: true,
        logoUrl: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        createdAt: true
      }
    });

    if (!provider) {
      res.status(404).json({ message: 'Provider profile not found' });
      return;
    }

    res.json(provider);
  } catch (err) {
    console.error('Error fetching public provider profile:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}
