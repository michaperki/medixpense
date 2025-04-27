
import { Request, Response } from 'express';
import { prisma } from '@packages/database';

/**
 * GET /api/procedures/categories
 */
export async function getCategories(req: Request, res: Response): Promise<Response> {
  try {
    const categories = await prisma.procedureCategory.findMany({
      orderBy: { name: 'asc' }
    });
    return res.json({ categories });
  } catch (err) {
    console.error('Error fetching categories:', err instanceof Error ? err.message : err);
    return res.status(500).json({ message: 'Failed to fetch categories' });
  }
}

/**
 * GET /api/procedures/templates
 */
export async function getTemplates(req: Request, res: Response): Promise<Response> {
  try {
    const { query, categoryId } = req.query;
    const where: any = {};

    if (typeof query === 'string' && query.trim()) {
      where.OR = [
        { name: { contains: query.trim(), mode: 'insensitive' } },
        { description: { contains: query.trim(), mode: 'insensitive' } }
      ];
    }

    if (typeof categoryId === 'string' && categoryId.trim()) {
      where.categoryId = categoryId;
    }

    const templates = await prisma.procedureTemplate.findMany({
      where,
      include: { category: true },
      orderBy: { name: 'asc' },
      take: 50
    });

    return res.json({ templates });
  } catch (err) {
    console.error('Error fetching templates:', err instanceof Error ? err.message : err);
    return res.status(500).json({ message: 'Failed to fetch procedure templates' });
  }
}

/**
 * GET /api/procedures/provider
 */
export async function getProviderProcedures(req: Request, res: Response): Promise<Response> {
  try {
    const providerId = req.user?.provider?.id;
    if (!providerId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const whereClause: any = {
      location: { providerId }
    };
    if (typeof req.query.locationId === 'string') {
      whereClause.locationId = req.query.locationId;
    }

    const procedures = await prisma.procedurePrice.findMany({
      where: whereClause,
      include: {
        template: { include: { category: true } },
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

    return res.json({ procedures });
  } catch (err) {
    console.error('Error fetching provider procedures:', err instanceof Error ? err.message : err);
    return res.status(500).json({ message: 'Failed to fetch procedures' });
  }
}

/**
 * GET /api/procedures/price/:id
 */
export async function getProcedurePrice(req: Request, res: Response): Promise<Response> {
  try {
    const procedurePrice = await prisma.procedurePrice.findUnique({
      where: { id: req.params.id },
      include: {
        template: { include: { category: true } },
        location: true
      }
    });

    if (!procedurePrice) {
      return res.status(404).json({ message: 'Procedure price not found' });
    }

    return res.json({ procedurePrice });
  } catch (err) {
    console.error('Error fetching procedure price:', err instanceof Error ? err.message : err);
    return res.status(500).json({ message: 'Failed to fetch procedure price' });
  }
}

/**
 * POST /api/procedures/price
 */
export async function createProcedurePrice(req: Request, res: Response): Promise<Response> {
  try {
    const { locationId, templateId, price, comments, isActive = true } = req.body;

    const location = await prisma.location.findFirst({
      where: { id: locationId, providerId: req.user.provider.id }
    });

    if (!location) {
      return res.status(403).json({ message: 'Not authorized to add procedures to this location' });
    }

    const existing = await prisma.procedurePrice.findFirst({
      where: { locationId, templateId }
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
        template: { include: { category: true } },
        location: true
      }
    });

    return res.status(201).json({ procedurePrice });
  } catch (err) {
    console.error('Error creating procedure price:', err instanceof Error ? err.message : err);
    return res.status(500).json({ message: 'Failed to create procedure price' });
  }
}

/**
 * PUT /api/procedures/price/:id
 */
export async function updateProcedurePrice(req: Request, res: Response): Promise<Response> {
  try {
    const { price, comments, isActive } = req.body;

    const procedure = await prisma.procedurePrice.findUnique({
      where: { id: req.params.id },
      include: { location: true }
    });

    if (!procedure) {
      return res.status(404).json({ message: 'Procedure price not found' });
    }

    if (procedure.location.providerId !== req.user.provider.id) {
      return res.status(403).json({ message: 'Not authorized to update this procedure' });
    }

    const updated = await prisma.procedurePrice.update({
      where: { id: req.params.id },
      data: { price: parseFloat(price), comments, isActive },
      include: {
        template: { include: { category: true } },
        location: true
      }
    });

    return res.json({ procedurePrice: updated });
  } catch (err) {
    console.error('Error updating procedure price:', err instanceof Error ? err.message : err);
    return res.status(500).json({ message: 'Failed to update procedure price' });
  }
}

/**
 * DELETE /api/procedures/price/:id
 */
export async function deleteProcedurePrice(req: Request, res: Response): Promise<Response> {
  try {
    const procedure = await prisma.procedurePrice.findUnique({
      where: { id: req.params.id },
      include: { location: true }
    });

    if (!procedure) {
      return res.status(404).json({ message: 'Procedure price not found' });
    }

    if (procedure.location.providerId !== req.user.provider.id) {
      return res.status(403).json({ message: 'Not authorized to delete this procedure' });
    }

    await prisma.procedurePrice.delete({ where: { id: req.params.id } });

    return res.status(204).end();
  } catch (err) {
    console.error('Error deleting procedure price:', err instanceof Error ? err.message : err);
    return res.status(500).json({ message: 'Failed to delete procedure price' });
  }
}

/**
 * GET /api/procedures/:id
 * Get a procedure template with all available provider prices
 */
export async function getProcedureById(req: Request, res: Response): Promise<Response> {
  try {
    const { id } = req.params;

    const template = await prisma.procedureTemplate.findUnique({
      where: { id },
      include: { category: true }
    });

    if (!template) {
      return res.status(404).json({ message: 'Procedure not found' });
    }

    const prices = await prisma.procedurePrice.findMany({
      where: { templateId: id, isActive: true },
      include: { location: true }
    });

    const providersData = await Promise.all(
      prices.map(async (price) => {
        const provider = await prisma.provider.findUnique({
          where: { id: price.location.providerId }
        });

        return {
          id: price.id,
          price: price.price,
          provider: {
            id: provider?.id || price.location.providerId || 'unknown',
            name: provider?.organizationName || 'Provider',
            location: {
              id: price.location.id,
              address1: price.location.address1,
              address2: price.location.address2,
              city: price.location.city,
              state: price.location.state,
              zipCode: price.location.zipCode
            }
          }
        };
      })
    );

    const procedure = {
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      providers: providersData
    };

    return res.json({ procedure });
  } catch (err) {
    console.error('Error fetching procedure by id:', err instanceof Error ? err.message : err);
    return res.status(500).json({ message: 'Failed to fetch procedure details' });
  }
}

/**
 * GET /api/locations/:locationId/procedures
 */
export async function getProceduresByLocation(req: Request, res: Response): Promise<Response> {
  try {
    const { locationId } = req.params;

    const procedures = await prisma.procedurePrice.findMany({
      where: { locationId },
      include: {
        template: { include: { category: true } },
        location: true
      },
      orderBy: [
        { template: { name: 'asc' } }
      ]
    });

    return res.json({ procedures });
  } catch (err) {
    console.error('Error fetching procedures by location:', err instanceof Error ? err.message : err);
    return res.status(500).json({ message: 'Failed to fetch procedures for location' });
  }
}
