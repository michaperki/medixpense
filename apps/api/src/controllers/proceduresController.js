// src/controllers/proceduresController.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

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
    const { locationId } = req.query;
    const providerId = req.user?.provider?.id;
    if (!providerId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Always scope to this provider
    const where = {
      location: { providerId }
    };

    // Optionally filter to a single location
    if (locationId) {
      where.locationId = locationId;
    }

    const procedures = await prisma.procedurePrice.findMany({
      where,
      include: {
        template: {
          include: { category: true }
        },
        location: true
      },
      orderBy: [
        { location: { name: 'asc' } },
        { template: { name: 'asc' } }
      ]
    });

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
