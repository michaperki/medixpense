// apps/api/src/controllers/profileController.js
import { PrismaClient } from '@prisma/client';
import { uploadToS3, getPublicUrl } from '../services/aws.js';

const prisma = new PrismaClient();

/**
 * GET /api/profile/provider
 * Get the current provider's profile
 */
export async function getProviderProfile(req, res) {
  try {
    const userId = req.user.id;
    
    // Get provider profile
    const provider = await prisma.provider.findUnique({
      where: { userId }
    });
    
    if (!provider) {
      return res.status(404).json({ message: 'Provider profile not found' });
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
export async function updateProviderProfile(req, res) {
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
export async function uploadProviderLogo(req, res) {
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
    
    // Upload to S3 (you'll need to implement this)
    const filename = `provider-logos/${userId}-${Date.now()}-${req.file.originalname}`;
    const result = await uploadToS3(req.file.buffer, filename, req.file.mimetype);
    const logoUrl = getPublicUrl(filename);
    
    // Update provider with logo URL
    const updatedProvider = await prisma.provider.update({
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
export async function getPublicProviderProfile(req, res) {
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
    
    res.json(provider);
  } catch (err) {
    console.error('Error fetching public provider profile:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}
