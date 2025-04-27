
import { Request, Response } from 'express';
import { uploadToS3, getPublicUrl } from '../services/aws';
import { prisma } from '@packages/database';

/**
 * GET /api/profile/provider
 * Get the current provider's profile
 */
export async function getProviderProfile(req: Request, res: Response): Promise<Response> {
  try {
    const userId = req.user.id;
    
    // Get provider profile
    const provider = await prisma.provider.findUnique({
      where: { userId }
    });
    
    if (!provider) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }
    
    return res.json(provider);
  } catch (err) {
    console.error('Error fetching provider profile:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * PUT /api/profile/provider
 * Update the current provider's profile
 */
export async function updateProviderProfile(req: Request, res: Response): Promise<Response> {
  try {
    const userId = req.user.id;
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
    
    // Check if provider exists
    const existingProvider = await prisma.provider.findUnique({
      where: { userId }
    });
    
    if (!existingProvider) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }
    
    // Update provider
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
    
    // Also update user phone if provided
    if (phone) {
      await prisma.user.update({
        where: { id: userId },
        data: { phone }
      });
    }
    
    return res.json(updatedProvider);
  } catch (err) {
    console.error('Error updating provider profile:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * POST /api/profile/provider/logo
 * Upload provider logo
 */
export async function uploadProviderLogo(req: Request, res: Response): Promise<Response> {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const userId = req.user.id;
    
    // Check if provider exists
    const provider = await prisma.provider.findUnique({
      where: { userId }
    });
    
    if (!provider) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }
    
    // Upload to S3
    const filename = `provider-logos/${userId}-${Date.now()}-${req.file.originalname}`;
    const result = await uploadToS3(req.file.buffer, filename, req.file.mimetype);
    const logoUrl = getPublicUrl(filename);
    
    // Update provider with logo URL
    const updatedProvider = await prisma.provider.update({
      where: { userId },
      data: { logoUrl }
    });
    
    return res.json({ logoUrl });
  } catch (err) {
    console.error('Error uploading provider logo:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * GET /api/profile/provider/:providerId/public
 * Get public provider profile
 */
export async function getPublicProviderProfile(req: Request, res: Response): Promise<Response> {
  try {
    const { providerId } = req.params;
    
    // Get provider with limited fields for public viewing
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
        createdAt: true,
      }
    });
    
    if (!provider) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }
    
    return res.json(provider);
  } catch (err) {
    console.error('Error fetching public provider profile:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

