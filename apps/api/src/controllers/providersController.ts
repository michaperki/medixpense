import { Request, Response } from 'express';
import { prisma } from '@packages/database';

// Define interfaces for type safety
interface Location {
  id: string;
  name?: string;
  address1?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
}

interface Provider {
  id: string;
  userId?: string;
  organizationName: string;
  bio?: string;
  logoUrl?: string;
  website?: string;
  phone?: string;
  locations: Location[];
  mission?: string;
  email?: string;
  yearEstablished?: number;
  licensingInfo?: string;
  insuranceAccepted?: string[];
  specialties?: string[];
  services?: string[];
  reviewCount?: number;
  rating?: number;
}

interface ProcedurePrice {
  id: string;
  price?: number;
  locationId: string;
  isActive: boolean;
  template: {
    name: string;
    description?: string | null;
    category: {
      id: string;
      name: string;
    };
  };
  averageMarketPrice?: number | null;
}

interface SpecialtyRow {
  specialties: string[] | null;
}

// Get provider by userId
export const getProviderByUserId = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  try {
    const provider = await prisma.provider.findUnique({
      where: { userId },
      include: { locations: true },
    });

    if (!provider) {
      res.status(404).json({ message: 'Provider not found' });
      return;
    }

    res.json(provider);
  } catch (err) {
    console.error('Error fetching provider by userId:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get provider procedures
export const getProviderProcedures = async (req: Request, res: Response): Promise<void> => {
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
export const getSpecialties = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Fix: Remove type parameter from $queryRawUnsafe and use type assertion instead
    const rows = await prisma.$queryRawUnsafe(`SELECT specialties FROM "providers"`) as SpecialtyRow[];

    const specialties = [...new Set(
      // Fix: Add type to row parameter
      rows.flatMap((row: SpecialtyRow) => Array.isArray(row.specialties) ? row.specialties : [])
    )].sort();

    res.json({ specialties });
  } catch (err) {
    console.error('Error fetching specialties:', err);
    res.status(500).json({ message: 'Failed to fetch specialties' });
  }
};

// Get provider by Id
export const getProviderById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const provider = await prisma.provider.findUnique({
      where: { id },
      include: { locations: true },
    }) as Provider | null;

    if (!provider) {
      res.status(404).json({ message: 'Provider not found' });
      return;
    }

    const procedures = await prisma.procedurePrice.findMany({
      // Fix: Add type to loc parameter
      where: { locationId: { in: provider.locations.map((loc: Location) => loc.id) }, isActive: true },
      include: {
        template: { include: { category: true } },
      },
    });

    // Fix: Add type to proc parameter
    const formattedProcedures = procedures.map((proc: ProcedurePrice) => {
      let savingsPercent: number | null = null;
      const avgMarketPrice = proc.averageMarketPrice;
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
      mission: provider.mission || '',
      logoUrl: provider.logoUrl,
      website: provider.website,
      phone: provider.phone,
      email: provider.email || '',
      yearEstablished: provider.yearEstablished || null,
      licensingInfo: provider.licensingInfo || '',
      insuranceAccepted: provider.insuranceAccepted || [],
      specialties: provider.specialties || [],
      services: provider.services || [],
      reviewCount: provider.reviewCount || 0,
      rating: provider.rating || 0,
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
export const searchProviders = async (req: Request, res: Response): Promise<void> => {
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
    }) as Provider[];

    // Fix: Add type to provider parameter
    const formattedProviders = providers.map((provider: Provider) => {
      const primaryLocation = provider.locations[0] || {};

      return {
        id: provider.id,
        name: provider.organizationName,
        description: provider.bio || '',
        logoUrl: provider.logoUrl,
        website: provider.website,
        phone: provider.phone,
        reviewCount: provider.reviewCount || 0,
        rating: provider.rating || 0,
        location: {
          id: primaryLocation.id || '',
          city: primaryLocation.city || '',
          state: primaryLocation.state || '',
          zipCode: primaryLocation.zipCode || '',
          address1: primaryLocation.address1 || '',
          latitude: primaryLocation.latitude,
          longitude: primaryLocation.longitude,
        },
        specialties: provider.specialties || [],
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

// Get public provider profile
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
        createdAt: true,
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
