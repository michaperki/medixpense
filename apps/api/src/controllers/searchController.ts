
import { Request, Response } from 'express';
import { geocodeAddress } from '../services/geocoding.js';
import { calculateDistance } from '../utils/distance.js';
import { prisma } from '@packages/database';
import { ProcedurePrice, Provider } from '@prisma/client';

const toInt = (value: string | string[] | undefined, defaultValue = 0) =>
  parseInt(Array.isArray(value) ? value[0] : value ?? '', 10) || defaultValue;

type ProcedurePriceWithLocation = ProcedurePrice & {
  location: {
    id: string;
    name: string | null;
    address1: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    latitude: number | null;
    longitude: number | null;
    provider: {
      id: string;
      organizationName: string;
      logoUrl: string | null;
    };
  };
  template: {
    id: string;
    name: string;
    description: string | null;
    category: {
      id: string;
      name: string;
    };
  };
};

type ProcedureWithDistance = ProcedurePriceWithLocation & { distance?: number };

interface ProviderWithLocations extends Provider {
  locations: Array<{
    id: string;
    name: string | null;
    address1: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    latitude: number | null;
    longitude: number | null;
    distance?: number | null;
  }>;
  closestLocationDistance?: number | null;
}

export async function getProcedures(req: Request, res: Response): Promise<void> {
  try {
    const { query, categoryId, location, distance, sort, page, limit } = req.query;
    const perPage = toInt(limit as string, 20);
    const skip = (toInt(page as string, 1) - 1) * perPage;
    const searchRadius = toInt(distance as string, 50);
    const normalizedQuery = typeof query === 'string' ? query.trim().toLowerCase() : '';

    const where = {
      isActive: true,
      location: { isActive: true },
      template: {
        isActive: true,
        ...(categoryId ? { categoryId: categoryId as string } : {}),
        ...(normalizedQuery
          ? {
              OR: [
                { name: { contains: normalizedQuery, mode: 'insensitive' } },
                { description: { contains: normalizedQuery, mode: 'insensitive' } },
                { searchTerms: { contains: normalizedQuery, mode: 'insensitive' } }
              ]
            }
          : {})
      }
    };

    const [procedures, total] = await Promise.all([
      prisma.procedurePrice.findMany({
        where,
        include: {
          template: { include: { category: true } },
          location: { include: { provider: true } }
        },
        orderBy: { price: (sort as string)?.includes('desc') ? 'desc' : 'asc' },
        skip,
        take: perPage
      }),
      prisma.procedurePrice.count({ where })
    ]);

    let userCoords: { latitude: number; longitude: number } | null = null;
    let geocodeError: string | null = null;
    let items: ProcedureWithDistance[] = procedures as ProcedureWithDistance[];

    if (location && typeof location === 'string') {
      userCoords = await geocodeAddress(location);
      if (userCoords) {
        items = procedures.flatMap((p) => {
          if (!p.location?.latitude || !p.location?.longitude) return [];
          const d = calculateDistance(
            userCoords.latitude,
            userCoords.longitude,
            p.location.latitude,
            p.location.longitude
          );
          if (d > searchRadius) return [];
          return [{ ...p, distance: d }];
        });
      } else {
        geocodeError = 'Could not geocode the provided location';
      }
    }

    const sorted = [...items];
    if (sort === 'price_desc') {
      sorted.sort((a, b) => b.price - a.price);
    } else if (sort === 'distance_asc' && userCoords) {
      sorted.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    } else if (sort === 'name_asc') {
      sorted.sort((a, b) => (a.template.name ?? '').localeCompare(b.template.name ?? ''));
    } else {
      sorted.sort((a, b) => a.price - b.price);
    }

    const results = sorted.map(item => ({
      id: item.id,
      price: item.price,
      comments: item.comments,
      distance: item.distance ?? null,
      procedure: {
        id: item.template.id,
        name: item.template.name,
        description: item.template.description,
        category: item.template.category ? {
          id: item.template.category.id,
          name: item.template.category.name
        } : null
      },
      provider: {
        id: item.location.provider.id,
        name: item.location.provider.organizationName,
        logoUrl: item.location.provider.logoUrl
      },
      location: {
        id: item.location.id,
        name: item.location.name,
        address: item.location.address1
          ? `${item.location.address1}, ${item.location.city}, ${item.location.state} ${item.location.zipCode}`
          : '',
        city: item.location.city,
        state: item.location.state,
        zipCode: item.location.zipCode,
        latitude: item.location.latitude,
        longitude: item.location.longitude
      }
    }));

    const response: any = {
      results,
      pagination: {
        page: toInt(page as string, 1),
        limit: perPage,
        total,
        pages: Math.ceil(total / perPage)
      }
    };

    if (userCoords) {
      response.data = {
        searchLocation: {
          latitude: userCoords.latitude,
          longitude: userCoords.longitude,
          address: location
        }
      };
    }

    if (geocodeError) response.error = geocodeError;
    if (query && results.length) response.procedureName = results[0].procedure.name;

    res.json(response);
  } catch (err) {
    console.error('[ERROR] Search error:', err);
    res.status(500).json({ message: 'Error performing search' });
  }
}

export async function getStats(req: Request, res: Response): Promise<void> {
  try {
    const { templateId } = req.params;
    const { location, distance } = req.query;

    const template = await prisma.procedureTemplate.findUnique({
      where: { id: templateId },
      include: { category: true }
    });

    if (!template) {
      res.status(404).json({ message: 'Procedure template not found' });
      return;
    }

    const searchRadius = toInt(distance as string, 50);

    const prices = await prisma.procedurePrice.findMany({
      where: {
        templateId,
        isActive: true,
        location: { isActive: true }
      },
      include: { location: true }
    });

    let filtered = prices;
    let userCoords: { latitude: number; longitude: number } | null = null;
    let geocodeError: string | null = null;

    if (location && typeof location === 'string') {
      userCoords = await geocodeAddress(location);
      if (userCoords) {
        filtered = prices.filter(p =>
          p.location?.latitude && p.location?.longitude &&
          calculateDistance(userCoords.latitude, userCoords.longitude, p.location.latitude, p.location.longitude) <= searchRadius
        );
      } else {
        geocodeError = 'Could not geocode the provided location';
      }
    }

    const pricesList = filtered.map(p => p.price);
    const sortedPrices = [...pricesList].sort((a, b) => a - b);

    const median = pricesList.length
      ? pricesList.length % 2 === 0
        ? (sortedPrices[pricesList.length / 2 - 1] + sortedPrices[pricesList.length / 2]) / 2
        : sortedPrices[Math.floor(pricesList.length / 2)]
      : 0;

    const stats = {
      count: pricesList.length,
      min: pricesList.length ? Math.min(...pricesList) : 0,
      max: pricesList.length ? Math.max(...pricesList) : 0,
      average: pricesList.length
        ? Math.round(pricesList.reduce((sum, price) => sum + price, 0) / pricesList.length)
        : 0,
      median
    };

    const response: any = { template, stats };

    if (userCoords) {
      response.locationInfo = {
        searchLocation: location,
        searchRadius,
        providersInRange: filtered.length
      };
    }

    if (geocodeError) response.error = geocodeError;

    res.json(response);
  } catch (err) {
    console.error('[ERROR] Stats error:', err);
    res.status(500).json({ message: 'Error retrieving procedure statistics' });
  }
}

export async function getProviders(req: Request, res: Response): Promise<void> {
  try {
    const { query, location, distance, page, limit } = req.query;
    const perPage = toInt(limit as string, 20);
    const skip = (toInt(page as string, 1) - 1) * perPage;
    const searchRadius = toInt(distance as string, 50);
    const normalizedQuery = typeof query === 'string' ? query.trim().toLowerCase() : '';

    const where = {
      subscriptionStatus: 'ACTIVE',
      locations: { some: { isActive: true } },
      ...(normalizedQuery
        ? {
            OR: [
              { organizationName: { contains: normalizedQuery, mode: 'insensitive' } },
              { bio: { contains: normalizedQuery, mode: 'insensitive' } }
            ]
          }
        : {})
    };

    const [providers, total] = await Promise.all([
      prisma.provider.findMany({
        where,
        include: { locations: { where: { isActive: true } } },
        skip,
        take: perPage
      }),
      prisma.provider.count({ where })
    ]);

    let results = providers as ProviderWithLocations[];
    let userCoords: { latitude: number; longitude: number } | null = null;
    let geocodeError: string | null = null;

    if (location && typeof location === 'string') {
      userCoords = await geocodeAddress(location);
      if (userCoords) {
        results = providers
          .map(p => {
            const locs = p.locations.map(loc => {
              if (!loc.latitude || !loc.longitude) return { ...loc, distance: null };
              return {
                ...loc,
                distance: calculateDistance(userCoords.latitude, userCoords.longitude, loc.latitude, loc.longitude)
              };
            });
            const closest = locs
              .filter(l => l.distance !== null)
              .sort((a, b) => (a.distance! - b.distance!))[0];
            return {
              ...p,
              locations: locs,
              closestLocationDistance: closest?.distance ?? null
            };
          })
          .filter(p => p.closestLocationDistance !== null && p.closestLocationDistance! <= searchRadius)
          .sort((a, b) => (a.closestLocationDistance! - b.closestLocationDistance!));
      } else {
        geocodeError = 'Could not geocode the provided location';
        results = providers.map(p => ({
          ...p,
          locations: p.locations.map(loc => ({ ...loc, distance: null })),
          closestLocationDistance: null
        }));
      }
    }

    const formatted = results.map(p => {
      const closestLocation = p.locations[0];
      return {
        id: p.id,
        name: p.organizationName,
        logoUrl: p.logoUrl,
        website: p.website,
        bio: p.bio,
        location: {
          id: closestLocation.id,
          name: closestLocation.name,
          address1: closestLocation.address1,
          city: closestLocation.city,
          state: closestLocation.state,
          zipCode: closestLocation.zipCode,
          latitude: closestLocation.latitude,
          longitude: closestLocation.longitude,
          distance: closestLocation.distance ?? null
        },
        distance: p.closestLocationDistance ?? null
      };
    });

    const response: any = {
      results: formatted,
      pagination: {
        page: toInt(page as string, 1),
        limit: perPage,
        total,
        pages: Math.ceil(total / perPage)
      }
    };

    if (userCoords) {
      response.data = {
        searchLocation: {
          latitude: userCoords.latitude,
          longitude: userCoords.longitude,
          address: location
        }
      };
    }

    if (geocodeError) response.error = geocodeError;

    res.json(response);
  } catch (err) {
    console.error('[ERROR] Provider search error:', err);
    res.status(500).json({ message: 'Error searching for providers' });
  }
}

