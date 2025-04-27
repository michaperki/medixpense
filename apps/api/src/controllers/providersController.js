import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Existing methods
export const getProviderByUserId = async (req, res) => {
  const { userId } = req.params;
  const provider = await prisma.provider.findUnique({ where: { userId } });
  if (!provider) return res.status(404).json({ message: 'Provider not found' });
  res.json(provider);
};

// in apps/api/src/controllers/providersController.js

export const getProviderProcedures = async (req, res) => {
  const { providerId } = req.params;
  try {
    const raw = await prisma.procedurePrice.findMany({
      where: {
        location: { providerId }
      },
      include: {
        template: {
          include: { category: true }
        },
        // pull in the full Location object
        location: {
          select: {
            id: true,
            name: true,
            address1: true,
            city: true,
            state: true,
            zipCode: true
          }
        }
      },
      orderBy: [
        { location: { name: 'asc' } },
        { template: { name: 'asc' } }
      ]
    });

    // wrap in an object so the front-end sees `rawResponse.procedures`
    return res.json({ procedures: raw });
  } catch (err) {
    console.error('Error fetching provider procedures:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};



/**
 * GET /api/providers/specialties
 */
export const getSpecialties = async (_req, res) => {
  try {
    // Fetch just the array column
    const rows = await prisma.provider.findMany({
      select: { specialties: true }
    });

    // Flatten, dedupe, sort
    const specialties = [
      ...new Set(
        rows.flatMap(p => p.specialties || [])
      )
    ].sort();

    res.json({ specialties });
  } catch (err) {
    console.error('getSpecialties error:', err);
    res.status(500).json({ message: 'Failed to fetch specialties' });
  }
};

/**
 * GET /api/providers/:id
 * Get detailed information about a provider for public display
 */
export const getProviderById = async (req, res) => {
  try {
    const { id } = req.params;

    const provider = await prisma.provider.findUnique({
      where: { id },
      include: {
        locations: true,
        // Get procedures through locations
        // This assumes your schema has Provider -> Locations -> ProcedurePrices
        // Adjust as needed based on your actual schema
      }
    });

    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    // Get all procedures offered by this provider's locations
    const locationIds = provider.locations.map(loc => loc.id);
    const procedures = await prisma.procedurePrice.findMany({
      where: {
        locationId: { in: locationIds },
        isActive: true
      },
      include: {
        template: {
          include: {
            category: true
          }
        }
      }
    });

    // Format procedures to match expected structure
    const formattedProcedures = procedures.map(proc => {
      // Calculate savings percentage if possible
      let savingsPercent = null;
      if (proc.averageMarketPrice && proc.price) {
        savingsPercent = Math.round(((proc.averageMarketPrice - proc.price) / proc.averageMarketPrice) * 100);
      }

      return {
        id: proc.id,
        name: proc.template.name,
        description: proc.template.description,
        price: proc.price,
        savingsPercent,
        category: proc.template.category
      };
    });

    // Construct response with specified structure
    const response = {
      id: provider.id,
      name: provider.organizationName || provider.name,
      description: provider.description || provider.bio,
      mission: provider.mission,
      logoUrl: provider.logoUrl,
      website: provider.website,
      phone: provider.phone,
      email: provider.email,
      yearEstablished: provider.yearEstablished,
      licensingInfo: provider.licensingInfo,
      insuranceAccepted: provider.insuranceAccepted,
      specialties: provider.specialties,
      services: provider.services,
      reviewCount: provider.reviewCount,
      rating: provider.rating,
      locations: provider.locations,
      procedures: formattedProcedures
    };

    res.json({ provider: response });
  } catch (err) {
    console.error('Error fetching provider:', err);
    res.status(500).json({ message: 'Failed to fetch provider details' });
  }
};

/**
 * GET /api/search/providers
 * Search for providers based on various criteria
 */
export const searchProviders = async (req, res) => {
  try {
    const {
      query,
      location,
      distance = '50',
      specialty,
      sort = 'distance_asc',
      page = '1',
      limit = '20'
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const distanceNum = parseInt(distance, 10);

    // Build the where clause
    const where = {};

    // Text search
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { organizationName: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { specialties: { has: query } }
      ];
    }

    // Filter by specialty
    if (specialty) {
      where.specialties = { has: specialty };
    }

    // Location-based search
    let searchLocation = null;
    if (location) {
      // This would require a geocoding service to convert location string to coordinates
      // For now, we'll assume you have a way to do this
      
      // For demo, use hardcoded values
      searchLocation = {
        latitude: 37.7749, // San Francisco as default
        longitude: -122.4194
      };

      // If location found, filter by distance
      // This would require a database that supports geospatial queries
    }

    // Execute the count query for pagination
    const total = await prisma.provider.count({ where });

    // Determine the sort order
    let orderBy = {};
    switch (sort) {
      case 'name_asc':
        orderBy = { name: 'asc' };
        break;
      case 'rating_desc':
        orderBy = { rating: 'desc' };
        break;
      case 'procedure_count_desc':
        // Fallback to name
        orderBy = { name: 'asc' };
        break;
      case 'distance_asc':
      default:
        // Fallback to name
        orderBy = { name: 'asc' };
        break;
    }

    // Fetch the providers
    const providers = await prisma.provider.findMany({
      where,
      include: {
        locations: {
          take: 1, // Just get the primary location for list view
        }
      },
      orderBy,
      skip,
      take: limitNum
    });

    // Format the response
    const formattedProviders = providers.map(provider => {
      // Get the primary location
      const primaryLocation = provider.locations[0] || {};

      // Calculate distance if we have search coordinates and location has coordinates
      let distance = null;
      if (searchLocation && primaryLocation.latitude && primaryLocation.longitude) {
        // In a real implementation, calculate distance using Haversine formula
        // For demo, use a random value between 0 and the max distance
        distance = Math.random() * distanceNum;
      }

      return {
        id: provider.id,
        name: provider.organizationName || provider.name,
        description: provider.description || provider.bio,
        logoUrl: provider.logoUrl,
        website: provider.website,
        phone: provider.phone,
        reviewCount: provider.reviewCount,
        rating: provider.rating,
        location: {
          id: primaryLocation.id || '',
          city: primaryLocation.city || '',
          state: primaryLocation.state || '',
          zipCode: primaryLocation.zipCode || '',
          address1: primaryLocation.address1 || '',
          latitude: primaryLocation.latitude,
          longitude: primaryLocation.longitude
        },
        procedureCount: provider.procedureCount || Math.floor(Math.random() * 50) + 1, // Demo value
        specialties: provider.specialties || [],
        distance
      };
    });

    // Construct pagination info
    const pagination = {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    };

    res.json({
      providers: formattedProviders,
      pagination,
      data: searchLocation ? { searchLocation } : undefined
    });
  } catch (err) {
    console.error('Error searching providers:', err);
    res.status(500).json({ message: 'Failed to search providers' });
  }
};
