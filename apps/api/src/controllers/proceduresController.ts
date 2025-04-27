// src/controllers/proceduresController.js

import { prisma } from '@packages/database'

/**
 * GET /api/procedures/categories
 */
export async function getCategories(req, res) {
  try {
    const categories = await prisma.procedureCategory.findMany({
      orderBy: { name: 'asc' }
    });
    res.json({ categories });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
}

/**
 * GET /api/procedures/templates
 */
export async function getTemplates(req, res) {
  try {
    const { query, categoryId } = req.query;
    
    // Build where clause based on query params
    const where = {};
    
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    const templates = await prisma.procedureTemplate.findMany({
      where,
      include: {
        category: true
      },
      orderBy: { name: 'asc' },
      take: 50 // Limit results
    });
    
    res.json({ templates });
  } catch (err) {
    console.error('Error fetching templates:', err);
    res.status(500).json({ message: 'Failed to fetch procedure templates' });
  }
}

/**
 * GET /api/procedures/provider
 */
export async function getProviderProcedures(req, res) {
  try {
    // trust the authenticated user’s provider
    const providerId = req.user?.provider?.id;
    if (!providerId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // build your filter
    const whereClause = {
      location: { providerId }
    };
    if (req.query.locationId) {
      whereClause.locationId = req.query.locationId;
    }

    const procedures = await prisma.procedurePrice.findMany({
      where: whereClause,
      include: {
        template: {
          include: { category: true }
        },
        // explicitly select the fields you need
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

    // return as { procedures: [...] } so your frontend’s `rawResponse.procedures` line still works
    res.json({ procedures });
  } catch (err) {
    console.error('Error fetching provider procedures:', err);
    res.status(500).json({ message: 'Failed to fetch procedures' });
  }
}

/**
 * GET /api/procedures/price/:id
 */
export async function getProcedurePrice(req, res) {
  try {
    const procedurePrice = await prisma.procedurePrice.findUnique({
      where: { id: req.params.id },
      include: {
        template: {
          include: {
            category: true
          }
        },
        location: true
      }
    });
    
    if (!procedurePrice) {
      return res.status(404).json({ message: 'Procedure price not found' });
    }
    
    res.json({ procedurePrice });
  } catch (err) {
    console.error('Error fetching procedure price:', err);
    res.status(500).json({ message: 'Failed to fetch procedure price' });
  }
}

/**
 * POST /api/procedures/price
 */
export async function createProcedurePrice(req, res) {
  try {
    const { locationId, templateId, price, comments, isActive = true } = req.body;
    
    // Verify the location belongs to this provider
    const location = await prisma.location.findFirst({
      where: {
        id: locationId,
        providerId: req.user.provider.id
      }
    });
    
    if (!location) {
      return res.status(403).json({ message: 'Not authorized to add procedures to this location' });
    }
    
    // Check if procedure already exists
    const existing = await prisma.procedurePrice.findFirst({
      where: {
        locationId,
        templateId
      }
    });
    
    if (existing) {
      return res.status(400).json({ message: 'Procedure price already exists for this location' });
    }
    
    const procedurePrice = await prisma.procedurePrice.create({
      data: {
        locationId,
        templateId,
        price: parseFloat(price),
        comments,
        isActive
      },
      include: {
        template: {
          include: {
            category: true
          }
        },
        location: true
      }
    });
    
    res.status(201).json({ procedurePrice });
  } catch (err) {
    console.error('Error creating procedure price:', err);
    res.status(500).json({ message: 'Failed to create procedure price' });
  }
}

/**
 * PUT /api/procedures/price/:id
 */
export async function updateProcedurePrice(req, res) {
  try {
    const { price, comments, isActive } = req.body;
    
    // Verify the procedure belongs to this provider
    const procedure = await prisma.procedurePrice.findUnique({
      where: { id: req.params.id },
      include: {
        location: true
      }
    });
    
    if (!procedure) {
      return res.status(404).json({ message: 'Procedure price not found' });
    }
    
    if (procedure.location.providerId !== req.user.provider.id) {
      return res.status(403).json({ message: 'Not authorized to update this procedure' });
    }
    
    const updated = await prisma.procedurePrice.update({
      where: { id: req.params.id },
      data: {
        price: parseFloat(price),
        comments,
        isActive
      },
      include: {
        template: {
          include: {
            category: true
          }
        },
        location: true
      }
    });
    
    res.json({ procedurePrice: updated });
  } catch (err) {
    console.error('Error updating procedure price:', err);
    res.status(500).json({ message: 'Failed to update procedure price' });
  }
}

/**
 * DELETE /api/procedures/price/:id
 */
export async function deleteProcedurePrice(req, res) {
  try {
    // Verify the procedure belongs to this provider
    const procedure = await prisma.procedurePrice.findUnique({
      where: { id: req.params.id },
      include: {
        location: true
      }
    });
    
    if (!procedure) {
      return res.status(404).json({ message: 'Procedure price not found' });
    }
    
    if (procedure.location.providerId !== req.user.provider.id) {
      return res.status(403).json({ message: 'Not authorized to delete this procedure' });
    }
    
    await prisma.procedurePrice.delete({
      where: { id: req.params.id }
    });
    
    res.status(204).end();
  } catch (err) {
    console.error('Error deleting procedure price:', err);
    res.status(500).json({ message: 'Failed to delete procedure price' });
  }
}

export async function getProceduresByLocation(req, res) {
  const { locationId } = req.params;

  try {
    const procedures = await prisma.procedurePrice.findMany({
      where: { locationId },
      include: {
        template: {
          include: { category: true },
        },
      },
    });

    return res.status(200).json({ procedures });
  } catch (error) {
    console.error('Error fetching procedures for location:', error);
    return res.status(500).json({ message: 'Failed to fetch procedures' });
  }
}

/**
 * GET /api/procedures/:id
 * Get a procedure template with all available provider prices
 * This version is adjusted to work with our schema and frontend components
 */
export async function getProcedureById(req, res) {
  try {
    const { id } = req.params;
    
    // First, get the procedure template
    const template = await prisma.procedureTemplate.findUnique({
      where: { id },
      include: {
        category: true
      }
    });
    
    if (!template) {
      return res.status(404).json({ message: 'Procedure not found' });
    }
    
    // Log the available model fields to help with debugging
    console.log('Available models:', Object.keys(prisma));
    
    // Get all procedure prices (from different providers/locations)
    // Adjusting the include structure to account for our actual database schema
    const prices = await prisma.procedurePrice.findMany({
      where: { 
        templateId: id,
        isActive: true
      },
      include: {
        location: true
      }
    });
    
    // For each price, fetch the provider separately if needed
    const providersData = [];
    
    for (const price of prices) {
      // Assuming we have a provider relationship on location
      // If not, we'll need to adjust this based on our schema
      let provider;
      try {
        if (price.location.providerId) {
          provider = await prisma.provider.findUnique({
            where: { id: price.location.providerId }
          });
        }
      } catch (err) {
        console.warn('Error fetching provider for location:', price.location.id, err.message);
        // Continue without this provider
        continue;
      }
      
      // Calculate statistics for all prices
      const priceValues = prices.map(p => p.price);
      const stats = priceValues.length > 0 ? {
        averagePrice: priceValues.reduce((a, b) => a + b, 0) / priceValues.length,
        lowestPrice: Math.min(...priceValues),
        highestPrice: Math.max(...priceValues)
      } : {};
      
      // Use whatever provider fields we have available
      providersData.push({
        id: price.id,
        price: price.price,
        savingsPercent: stats.averagePrice ? Math.round(((stats.averagePrice - price.price) / stats.averagePrice) * 100) : null,
        provider: {
          id: provider?.id || price.location.providerId || 'unknown',
          name: provider?.organizationName || provider?.name || 'Provider',
          phone: provider?.phone,
          website: provider?.website,
          description: provider?.bio || provider?.description,
          location: {
            id: price.location.id,
            address1: price.location.address1,
            address2: price.location.address2,
            city: price.location.city,
            state: price.location.state,
            zipCode: price.location.zipCode,
            latitude: price.location.latitude,
            longitude: price.location.longitude
          }
        }
      });
    }
    
    // Combine everything into a procedure object
    const procedure = {
      id: template.id,
      name: template.name,
      description: template.description,
      duration: template.duration,
      preparation: template.preparation,
      aftercare: template.aftercare,
      category: template.category,
      providers: providersData,
      averagePrice: prices.length > 0 
        ? prices.reduce((sum, p) => sum + p.price, 0) / prices.length 
        : undefined,
      lowestPrice: prices.length > 0 
        ? Math.min(...prices.map(p => p.price)) 
        : undefined,
      highestPrice: prices.length > 0 
        ? Math.max(...prices.map(p => p.price)) 
        : undefined
    };
    
    // Add some debugging logs
    console.log(`Returning procedure with ${procedure.providers.length} providers`);
    
    res.json({ procedure });
  } catch (err) {
    console.error('Error fetching procedure:', err);
    res.status(500).json({ message: 'Failed to fetch procedure details' });
  }
}
