// apps/api/src/routes/search.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { geocodeAddress } from '../services/geocoding';
import { calculateDistance } from '../utils/distance';

const router = express.Router();
const prisma = new PrismaClient();

// Search for procedures by name, category, or location
router.get('/procedures', async (req, res) => {
  try {
    const {
      query,              // Text search term
      categoryId,         // Filter by category
      location,           // Location search (city, state or zip)
      distance = 50,      // Search radius (miles)
      sort = 'price_asc', // Sorting option
      page = 1,
      limit = 20
    } = req.query;
    
    const skip = (page - 1) * parseInt(limit);
    
    // Start building the query
    let procedureWhere = {
      isActive: true,
      location: {
        isActive: true
      },
      template: {
        isActive: true
      }
    };
    
    // Add category filter if provided
    if (categoryId) {
      procedureWhere.template = {
        ...procedureWhere.template,
        categoryId
      };
    }
    
    // Handle text search
    if (query) {
      procedureWhere.template = {
        ...procedureWhere.template,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { searchTerms: { contains: query, mode: 'insensitive' } }
        ]
      };
    }
    
    // Handle location-based search
    let userCoordinates = null;
    if (location) {
      userCoordinates = await geocodeAddress(location);
      
      // If geocoding failed, return empty results
      if (!userCoordinates) {
        return res.json({
          results: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0
          },
          error: 'Could not geocode the provided location'
        });
      }
    }
    
    // Get procedures
    const procedures = await prisma.procedurePrice.findMany({
      where: procedureWhere,
      include: {
        template: {
          include: {
            category: true
          }
        },
        location: {
          include: {
            provider: {
              select: {
                id: true,
                organizationName: true,
                logoUrl: true
              }
            }
          }
        }
      },
      orderBy: { // Add explicit ordering to help with index usage
        price: sort.includes('desc') ? 'desc' : 'asc'
      },
      skip,
      take: parseInt(limit)
    });
    
    // Count total matching procedures
    const total = await prisma.procedurePrice.count({
      where: procedureWhere
    });
    
    // If location search, calculate distances and filter by radius
    let resultsWithDistance = procedures;
    
    if (userCoordinates) {
      resultsWithDistance = procedures
        .map(procedure => {
          const { latitude, longitude } = procedure.location;
          
          // Skip items without coordinates
          if (!latitude || !longitude) return null;
          
          const distanceInMiles = calculateDistance(
            userCoordinates.latitude,
            userCoordinates.longitude,
            latitude,
            longitude
          );
          
          return {
            ...procedure,
            distance: distanceInMiles
          };
        })
        .filter(item => item !== null && item.distance <= parseInt(distance));
    }
    
    // Sort the results
    let sortedResults = [...resultsWithDistance];
    
    switch (sort) {
      case 'price_asc':
        sortedResults.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        sortedResults.sort((a, b) => b.price - a.price);
        break;
      case 'distance_asc':
        if (userCoordinates) {
          sortedResults.sort((a, b) => a.distance - b.distance);
        }
        break;
      case 'name_asc':
        sortedResults.sort((a, b) => a.template.name.localeCompare(b.template.name));
        break;
      default:
        // Default to price ascending
        sortedResults.sort((a, b) => a.price - b.price);
    }
    
    // Format the response
    const formattedResults = sortedResults.map(item => ({
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
        address: `${item.location.address1}, ${item.location.city}, ${item.location.state} ${item.location.zipCode}`,
        provider: {
          id: item.location.provider.id,
          name: item.location.provider.organizationName,
          logoUrl: item.location.provider.logoUrl
        }
      }
    }));
    
    res.json({
      results: formattedResults,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Error performing search' });
  }
});

// Get pricing statistics for a procedure template
router.get('/stats/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { location, distance = 50 } = req.query;
    
    // Verify template exists
    const template = await prisma.procedureTemplate.findUnique({
      where: { id: templateId },
      include: { category: true }
    });
    
    if (!template) {
      return res.status(404).json({ message: 'Procedure template not found' });
    }
    
    // Build query for pricing data
    let priceWhere = {
      templateId,
      isActive: true,
      location: {
        isActive: true
      }
    };
    
    // Get user coordinates for location search
    let userCoordinates = null;
    if (location) {
      userCoordinates = await geocodeAddress(location);
      
      // If geocoding failed, just continue without location filtering
      if (!userCoordinates) {
        console.warn('Could not geocode location:', location);
      }
    }
    
    // Get all prices for this template
    const prices = await prisma.procedurePrice.findMany({
      where: priceWhere,
      include: {
        location: true
      }
    });
    
    // Filter by distance if coordinates available
    let filteredPrices = prices;
    
    if (userCoordinates) {
      filteredPrices = prices.filter(price => {
        const { latitude, longitude } = price.location;
        
        // Skip items without coordinates
        if (!latitude || !longitude) return false;
        
        const distanceInMiles = calculateDistance(
          userCoordinates.latitude,
          userCoordinates.longitude,
          latitude,
          longitude
        );
        
        return distanceInMiles <= parseInt(distance);
      });
    }
    
    // Calculate statistics
    const priceValues = filteredPrices.map(p => p.price);
    
    const stats = {
      count: priceValues.length,
      min: priceValues.length > 0 ? Math.min(...priceValues) : 0,
      max: priceValues.length > 0 ? Math.max(...priceValues) : 0,
      avg: priceValues.length > 0
        ? Math.round(priceValues.reduce((sum, val) => sum + val, 0) / priceValues.length)
        : 0
    };
    
    res.json({
      template,
      stats,
      locationInfo: userCoordinates ? {
        searchLocation: location,
        searchRadius: parseInt(distance),
        providersInRange: filteredPrices.length
      } : null
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Error retrieving procedure statistics' });
  }
});

// Search for providers
router.get('/providers', async (req, res) => {
  try {
    const {
      query,         // Provider name search
      location,      // Location search
      distance = 50, // Search radius (miles)
      page = 1,
      limit = 20
    } = req.query;
    
    const skip = (page - 1) * parseInt(limit);
    
    // Build provider query
    let providerWhere = {};
    
    if (query) {
      providerWhere.OR = [
        { organizationName: { contains: query, mode: 'insensitive' } },
        { bio: { contains: query, mode: 'insensitive' } }
      ];
    }
    
    // Get all providers with active locations
    const providers = await prisma.provider.findMany({
      where: {
        ...providerWhere,
        locations: {
          some: {
            isActive: true
          }
        },
        subscriptionStatus: 'ACTIVE'
      },
      include: {
        locations: {
          where: {
            isActive: true
          }
        }
      },
      skip,
      take: parseInt(limit)
    });
    
    // Count total providers
    const total = await prisma.provider.count({
      where: {
        ...providerWhere,
        locations: {
          some: {
            isActive: true
          }
        },
        subscriptionStatus: 'ACTIVE'
      }
    });
    
    // Process location search if provided
    let resultsWithDistance = providers;
    let userCoordinates = null;
    
    if (location) {
      userCoordinates = await geocodeAddress(location);
      
      if (userCoordinates) {
        // Add distance to each provider's locations
        resultsWithDistance = providers.map(provider => {
          const locationsWithDistance = provider.locations.map(loc => {
            const { latitude, longitude } = loc;
            
            if (!latitude || !longitude) return { ...loc, distance: null };
            
            const distanceInMiles = calculateDistance(
              userCoordinates.latitude,
              userCoordinates.longitude,
              latitude,
              longitude
            );
            
            return {
              ...loc,
              distance: distanceInMiles
            };
          });
          
          // Find closest location
          const closestLocation = locationsWithDistance
            .filter(loc => loc.distance !== null)
            .sort((a, b) => a.distance - b.distance)[0];
          
          return {
            ...provider,
            locations: locationsWithDistance,
            closestLocationDistance: closestLocation ? closestLocation.distance : null
          };
        });
        
        // Filter providers with no locations in range
        resultsWithDistance = resultsWithDistance
          .filter(provider => 
            provider.closestLocationDistance !== null && 
            provider.closestLocationDistance <= parseInt(distance)
          )
          .sort((a, b) => a.closestLocationDistance - b.closestLocationDistance);
      }
    }
    
    // Format the response
    const formattedResults = resultsWithDistance.map(provider => ({
      id: provider.id,
      name: provider.organizationName,
      logoUrl: provider.logoUrl,
      website: provider.website,
      bio: provider.bio,
      locations: provider.locations.map(loc => ({
        id: loc.id,
        name: loc.name,
        address: `${loc.address1}, ${loc.city}, ${loc.state} ${loc.zipCode}`,
        distance: loc.distance
      })),
      distance: provider.closestLocationDistance
    }));
    
    res.json({
      results: formattedResults,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Provider search error:', error);
    res.status(500).json({ message: 'Error searching for providers' });
  }
});

export default router;

