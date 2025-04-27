import { Request, Response } from 'express';
import { prisma } from '@packages/database';

// Get provider by userId
export const getProviderByUserId = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const provider = await prisma.provider.findUnique({
      where: { userId },
      include: { locations: true },
    });

    if (!provider) return res.status(404).json({ message: 'Provider not found' });
    res.json(provider);
  } catch (err) {
    console.error('Error fetching provider by userId:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get provider procedures
export const getProviderProcedures = async (req: Request, res: Response) => {
  const { providerId } = req.params;

  try {
    const procedures = await prisma.procedurePrice.findMany({
      where: { location: { providerId } },
      include: {
        template: { include: { category: true } },
        location: {
          select: {
            id: true,
            name: true,
            address1: true,
            city: true,
            state: true,
            zipCode: true,
          },
        },
      },
      orderBy: [
        { location: { name: 'asc' } },
        { template: { name: 'asc' } },
      ],
    });

    res.json({ procedures });
  } catch (err) {
    console.error('Error fetching provider procedures:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get specialties
export const getSpecialties = async (_req: Request, res: Response) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(`SELECT specialties FROM "providers"`);

    const specialties = [...new Set(
      rows.flatMap(row => Array.isArray(row.specialties) ? row.specialties : [])
    )].sort();

    res.json({ specialties });
  } catch (err) {
    console.error('Error fetching specialties:', err);
    res.status(500).json({ message: 'Failed to fetch specialties' });
  }
};

// Get provider by Id
export const getProviderById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const provider = await prisma.provider.findUnique({
      where: { id },
      include: { locations: true },
    });

    if (!provider) return res.status(404).json({ message: 'Provider not found' });

    const procedures = await prisma.procedurePrice.findMany({
      where: { locationId: { in: provider.locations.map(loc => loc.id) }, isActive: true },
      include: {
        template: { include: { category: true } },
      },
    });

    const formattedProcedures = procedures.map(proc => {
      let savingsPercent: number | null = null;
      const avgMarketPrice = (proc as any).averageMarketPrice;
      if (avgMarketPrice && proc.price) {
        savingsPercent = Math.round(((avgMarketPrice - proc.price) / avgMarketPrice) * 100);
      }

      return {
        id: proc.id,
        name: proc.template.name,
        description: proc.template.description,
        price: proc.price,
        savingsPercent,
        category: proc.template.category,
      };
    });

    const response = {
      id: provider.id,
      name: provider.organizationName,
      description: provider.bio || '',
      mission: (provider as any).mission || '',
      logoUrl: provider.logoUrl,
      website: provider.website,
      phone: provider.phone,
      email: (provider as any).email || '',
      yearEstablished: (provider as any).yearEstablished || null,
      licensingInfo: (provider as any).licensingInfo || '',
      insuranceAccepted: (provider as any).insuranceAccepted || [],
      specialties: (provider as any).specialties || [],
      services: (provider as any).services || [],
      reviewCount: (provider as any).reviewCount || 0,
      rating: (provider as any).rating || 0,
      locations: provider.locations,
      procedures: formattedProcedures,
    };

    res.json({ provider: response });
  } catch (err) {
    console.error('Error fetching provider by id:', err);
    res.status(500).json({ message: 'Failed to fetch provider details' });
  }
};

// Search providers
export const searchProviders = async (req: Request, res: Response) => {
  const {
    query,
    location,
    distance = '50',
    specialty,
    sort = 'distance_asc',
    page = '1',
    limit = '20',
  } = req.query;

  try {
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (typeof query === 'string' && query.trim()) {
      where.OR = [
        { organizationName: { contains: query.trim(), mode: 'insensitive' } },
        { bio: { contains: query.trim(), mode: 'insensitive' } },
      ];
    }

    if (typeof specialty === 'string' && specialty.trim()) {
      where.specialties = { has: specialty.trim() };
    }

    const total = await prisma.provider.count({ where });

    const providers = await prisma.provider.findMany({
      where,
      include: { locations: { take: 1 } },
      orderBy: { organizationName: 'asc' },
      skip,
      take: limitNum,
    });

    const formattedProviders = providers.map(provider => {
      const primaryLocation = provider.locations[0] || {};

      return {
        id: provider.id,
        name: provider.organizationName,
        description: provider.bio || '',
        logoUrl: provider.logoUrl,
        website: provider.website,
        phone: provider.phone,
        reviewCount: (provider as any).reviewCount || 0,
        rating: (provider as any).rating || 0,
        location: {
          id: primaryLocation.id || '',
          city: primaryLocation.city || '',
          state: primaryLocation.state || '',
          zipCode: primaryLocation.zipCode || '',
          address1: primaryLocation.address1 || '',
          latitude: primaryLocation.latitude,
          longitude: primaryLocation.longitude,
        },
        specialties: (provider as any).specialties || [],
      };
    });

    const pagination = {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    };

    res.json({ providers: formattedProviders, pagination });
  } catch (err) {
    console.error('Error searching providers:', err);
    res.status(500).json({ message: 'Failed to search providers' });
  }
};
