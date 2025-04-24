// apps/api/src/controllers/searchController.js
import { PrismaClient } from '@prisma/client';
import { geocodeAddress } from '../services/geocoding.js';
import { calculateDistance } from '../utils/distance.js';

const prisma = new PrismaClient();

// GET /procedures
export async function getProcedures(req, res) {
  try {
    const {
      query,
      categoryId,
      location,
      distance = 50,
      sort = 'price_asc',
      page = 1,
      limit = 20
    } = req.query;
    const skip = (page - 1) * parseInt(limit, 10);

    // Build base where clause
    let where = {
      isActive: true,
      location: { isActive: true },
      template: { isActive: true }
    };
    if (categoryId) where.template.categoryId = categoryId;
    if (query) where.template.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { searchTerms: { contains: query, mode: 'insensitive' } }
    ];

    // Fetch matching prices
    const [procedures, total] = await Promise.all([
      prisma.procedurePrice.findMany({
        where,
        include: {
          template: { include: { category: true } },
          location: { include: { provider: { select: { id: true, organizationName: true, logoUrl: true } } } }
        },
        orderBy: { price: sort.includes('desc') ? 'desc' : 'asc' },
        skip,
        take: parseInt(limit, 10)
      }),
      prisma.procedurePrice.count({ where })
    ]);

    // Geocode if needed and handle potential failure
    let userCoords = null;
    let geocodeError = null;
    let items = procedures;
    
    if (location) {
      userCoords = await geocodeAddress(location);
      
      if (userCoords) {
        // If geocoding succeeded, compute distances & filter
        items = procedures
          .map(p => {
            if (!p.location.latitude || !p.location.longitude) return null;
            const d = calculateDistance(
              userCoords.latitude, userCoords.longitude,
              p.location.latitude, p.location.longitude
            );
            return { ...p, distance: d };
          })
          .filter(p => p && p.distance <= parseInt(distance, 10));
      } else {
        // If geocoding failed but we still have procedures, return them without distance filtering
        geocodeError = 'Could not geocode the provided location';
        console.warn(`Geocoding failed for location: ${location}`);
        // Keep all procedures but don't filter by distance
        items = procedures.map(p => ({ ...p, distance: null }));
      }
    }

    // Sort by requested field
    const sorted = [...items];
    switch (sort) {
      case 'price_desc':   sorted.sort((a,b)=>b.price-a.price); break;
      case 'distance_asc': 
        if (userCoords) {
          sorted.sort((a,b)=>(a.distance || Infinity)-(b.distance || Infinity)); 
        }
        break;
      case 'name_asc':     sorted.sort((a,b)=>a.template.name.localeCompare(b.template.name)); break;
      default:             sorted.sort((a,b)=>a.price-b.price);
    }

    // Format and return
    const results = sorted.map(item => ({
      id: item.id,
      price: item.price,
      comments: item.comments,
      distance: item.distance,
      procedure: {
        id: item.template.id,
        name: item.template.name,
        description: item.template.description,
        category: {
          id: item.template.category.id,
          name: item.template.category.name
        }
      },
      location: {
        id: item.location.id,
        name: item.location.name,
        address: item.location.address1 ? 
          `${item.location.address1}, ${item.location.city}, ${item.location.state} ${item.location.zipCode}` : 
          'Address not available',
        city: item.location.city,
        state: item.location.state,
        zipCode: item.location.zipCode,
        latitude: item.location.latitude,
        longitude: item.location.longitude,
        provider: {
          id: item.location.provider.id,
          name: item.location.provider.organizationName,
          logoUrl: item.location.provider.logoUrl
        }
      }
    }));

    // Prepare the response
    const response = {
      results,
      pagination: {
        page: parseInt(page,10),
        limit: parseInt(limit,10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    };

    // Add search metadata if we have it
    if (userCoords) {
      response.data = {
        searchLocation: {
          latitude: userCoords.latitude,
          longitude: userCoords.longitude,
          address: location
        }
      };
    }

    // Add procedureName if querying for a specific procedure
    if (query && results.length > 0) {
      response.procedureName = results[0].procedure.name;
    }

    // Add error if geocoding failed but still return results
    if (geocodeError) {
      response.error = geocodeError;
    }

    res.json(response);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ message: 'Error performing search' });
  }
}

// GET /stats/:templateId
export async function getStats(req, res) {
  try {
    const { templateId } = req.params;
    const { location, distance = 50 } = req.query;

    const template = await prisma.procedureTemplate.findUnique({
      where: { id: templateId },
      include: { category: true }
    });
    if (!template) return res.status(404).json({ message: 'Procedure template not found' });

    // Base where for prices
    let where = { templateId, isActive: true, location: { isActive: true } };

    // Fetch all matching prices
    const prices = await prisma.procedurePrice.findMany({
      where,
      include: { location: true }
    });

    // Calculate stats even if geocoding fails
    let filtered = prices;
    let userCoords = null;
    let geocodeError = null;
    
    if (location) {
      userCoords = await geocodeAddress(location);
      if (userCoords) {
        filtered = prices.filter(p => {
          if (!p.location.latitude || !p.location.longitude) return false;
          const d = calculateDistance(
            userCoords.latitude, userCoords.longitude,
            p.location.latitude, p.location.longitude
          );
          return d <= parseInt(distance,10);
        });
      } else {
        geocodeError = 'Could not geocode the provided location';
        // Keep using all prices if geocoding failed
        console.warn(`Geocoding failed for location in stats: ${location}`);
      }
    }

    // Calculate price statistics
    const vals = filtered.map(p => p.price);
    const sorted = [...vals].sort((a, b) => a - b);
    const median = vals.length ? 
      (vals.length % 2 === 0 ? 
        (sorted[vals.length/2-1] + sorted[vals.length/2])/2 : 
        sorted[Math.floor(vals.length/2)]
      ) : 0;
      
    const stats = {
      count: vals.length,
      min: vals.length ? Math.min(...vals) : 0,
      max: vals.length ? Math.max(...vals) : 0,
      average: vals.length ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length) : 0,
      median: median
    };

    const response = {
      template,
      stats
    };

    if (userCoords) {
      response.locationInfo = {
        searchLocation: location,
        searchRadius: parseInt(distance,10),
        providersInRange: filtered.length
      };
    }

    if (geocodeError) {
      response.error = geocodeError;
    }

    res.json(response);
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ message: 'Error retrieving procedure statistics' });
  }
}

// GET /providers
export async function getProviders(req, res) {
  try {
    const { query, location, distance = 50, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * parseInt(limit, 10);

    // Build provider filter
    let where = { subscriptionStatus: 'ACTIVE', locations: { some: { isActive: true } } };
    if (query) where.OR = [
      { organizationName: { contains: query, mode: 'insensitive' } },
      { bio:              { contains: query, mode: 'insensitive' } }
    ];

    const [providers, total] = await Promise.all([
      prisma.provider.findMany({
        where,
        include: { locations: { where: { isActive: true } } },
        skip,
        take: parseInt(limit,10)
      }),
      prisma.provider.count({ where })
    ]);

    // Handle location filtering with geocoding error possibility
    let results = providers;
    let userCoords = null;
    let geocodeError = null;
    
    if (location) {
      userCoords = await geocodeAddress(location);
      
      if (userCoords) {
        results = providers
          .map(p => {
            const locs = p.locations.map(loc => {
              if (!loc.latitude || !loc.longitude) return { ...loc, distance: null };
              return {
                ...loc,
                distance: calculateDistance(
                  userCoords.latitude,
                  userCoords.longitude,
                  loc.latitude,
                  loc.longitude
                )
              };
            });
            const closest = locs.filter(l=>l.distance!=null).sort((a,b)=>a.distance-b.distance)[0];
            return {
              ...p,
              locations: locs,
              closestLocationDistance: closest?.distance ?? null
            };
          })
          .filter(p => p.closestLocationDistance !== null && p.closestLocationDistance <= parseInt(distance,10))
          .sort((a,b) => a.closestLocationDistance - b.closestLocationDistance);
      } else {
        geocodeError = 'Could not geocode the provided location';
        console.warn(`Geocoding failed for location in providers: ${location}`);
        // Keep all providers but don't filter by distance
        results = providers.map(p => ({
          ...p,
          locations: p.locations.map(loc => ({ ...loc, distance: null })),
          closestLocationDistance: null
        }));
      }
    }

    const formatted = results.map(p => ({
      id: p.id,
      name: p.organizationName,
      logoUrl: p.logoUrl,
      website: p.website,
      bio: p.bio,
      locations: p.locations.map(l => ({
        id: l.id,
        name: l.name,
        address: `${l.address1}, ${l.city}, ${l.state} ${l.zipCode}`,
        distance: l.distance
      })),
      distance: p.closestLocationDistance
    }));

    const response = {
      results: formatted,
      pagination: {
        page: parseInt(page,10),
        limit: parseInt(limit,10),
        total,
        pages: Math.ceil(total/parseInt(limit,10))
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

    if (geocodeError) {
      response.error = geocodeError;
    }

    res.json(response);
  } catch (err) {
    console.error('Provider search error:', err);
    res.status(500).json({ message: 'Error searching for providers' });
  }
}
