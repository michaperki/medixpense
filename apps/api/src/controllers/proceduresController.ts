import { Request, Response } from 'express';
import { prisma } from '@packages/database';

/**
 * GET /api/procedures/categories
 */
export async function getCategories(req: Request, res: Response): Promise<void> {
  try {
    const categories = await prisma.procedureCategory.findMany({
      orderBy: { name: 'asc' }
    });
    res.json({ categories });
  } catch (err) {
    console.error('Error fetching categories:', err instanceof Error ? err.message : err);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
}

/**
 * GET /api/procedures/templates
 */
export async function getTemplates(req: Request, res: Response): Promise<void> {
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

    res.json({ templates });
  } catch (err) {
    console.error('Error fetching templates:', err instanceof Error ? err.message : err);
    res.status(500).json({ message: 'Failed to fetch procedure templates' });
  }
}

/**
 * GET /api/procedures/provider
 */
export async function getProviderProcedures(req: Request, res: Response): Promise<void> {
  try {
    const providerId = req.user?.provider?.id;
    if (!providerId) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    const whereClause: any = { location: { providerId } };
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

    res.json({ procedures });
  } catch (err) {
    console.error('Error fetching provider procedures:', err instanceof Error ? err.message : err);
    res.status(500).json({ message: 'Failed to fetch procedures' });
  }
}

/**
 * GET /api/procedures/price/:id
 */
export async function getProcedurePrice(req: Request, res: Response): Promise<void> {
  try {
    const procedurePrice = await prisma.procedurePrice.findUnique({
      where: { id: req.params.id },
      include: {
        template: { include: { category: true } },
        location: true
      }
    });

    if (!procedurePrice) {
      res.status(404).json({ message: 'Procedure price not found' });
      return;
    }

    res.json({ procedurePrice });
  } catch (err) {
    console.error('Error fetching procedure price:', err instanceof Error ? err.message : err);
    res.status(500).json({ message: 'Failed to fetch procedure price' });
  }
}

/**
 * POST /api/procedures/price
 */
export async function createProcedurePrice(req: Request, res: Response): Promise<void> {
  try {
    const { locationId, templateId, price, comments, isActive = true } = req.body;

    const location = await prisma.location.findFirst({
      where: { id: locationId, providerId: req.user?.provider?.id }
    });

    if (!location) {
      res.status(403).json({ message: 'Not authorized to add procedures to this location' });
      return;
    }

    const existing = await prisma.procedurePrice.findFirst({
      where: { locationId, templateId }
    });

    if (existing) {
      res.status(400).json({ message: 'Procedure price already exists for this location' });
      return;
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

    res.status(201).json({ procedurePrice });
  } catch (err) {
    console.error('Error creating procedure price:', err instanceof Error ? err.message : err);
    res.status(500).json({ message: 'Failed to create procedure price' });
  }
}

/**
 * PUT /api/procedures/price/:id
 */
export async function updateProcedurePrice(req: Request, res: Response): Promise<void> {
  try {
    const { price, comments, isActive } = req.body;

    const procedure = await prisma.procedurePrice.findUnique({
      where: { id: req.params.id },
      include: { location: true }
    });

    if (!procedure) {
      res.status(404).json({ message: 'Procedure price not found' });
      return;
    }

    if (procedure.location.providerId !== req.user?.provider?.id) {
      res.status(403).json({ message: 'Not authorized to update this procedure' });
      return;
    }

    const updated = await prisma.procedurePrice.update({
      where: { id: req.params.id },
      data: { price: parseFloat(price), comments, isActive },
      include: {
        template: { include: { category: true } },
        location: true
      }
    });

    res.json({ procedurePrice: updated });
  } catch (err) {
    console.error('Error updating procedure price:', err instanceof Error ? err.message : err);
    res.status(500).json({ message: 'Failed to update procedure price' });
  }
}

/**
 * DELETE /api/procedures/price/:id
 */
export async function deleteProcedurePrice(req: Request, res: Response): Promise<void> {
  try {
    const procedure = await prisma.procedurePrice.findUnique({
      where: { id: req.params.id },
      include: { location: true }
    });

    if (!procedure) {
      res.status(404).json({ message: 'Procedure price not found' });
      return;
    }

    if (procedure.location.providerId !== req.user?.provider?.id) {
      res.status(403).json({ message: 'Not authorized to delete this procedure' });
      return;
    }

    await prisma.procedurePrice.delete({ where: { id: req.params.id } });

    res.status(204).end();
  } catch (err) {
    console.error('Error deleting procedure price:', err instanceof Error ? err.message : err);
    res.status(500).json({ message: 'Failed to delete procedure price' });
  }
}

/**
 * GET /api/procedures/:id
 * Get a procedure template with all available provider prices
 */
export async function getProcedureById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const template = await prisma.procedureTemplate.findUnique({
      where: { id },
      include: { category: true }
    });

    if (!template) {
      res.status(404).json({ message: 'Procedure not found' });
      return;
    }

    const prices = await prisma.procedurePrice.findMany({
      where: { templateId: id, isActive: true },
      include: { location: true }
    });

    const providersData = await Promise.all(
      prices.map(async (price: typeof prices[number]) => {
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

    res.json({ procedure });
  } catch (err) {
    console.error('Error fetching procedure by id:', err instanceof Error ? err.message : err);
    res.status(500).json({ message: 'Failed to fetch procedure details' });
  }
}

/**
 * GET /api/locations/:locationId/procedures
 */
export async function getProceduresByLocation(req: Request, res: Response): Promise<void> {
  try {
    const { locationId } = req.params;

    const procedures = await prisma.procedurePrice.findMany({
      where: { locationId },
      include: {
        template: { include: { category: true } },
        location: true
      },
      orderBy: [{ template: { name: 'asc' } }]
    });

    res.json({ procedures });
  } catch (err) {
    console.error('Error fetching procedures by location:', err instanceof Error ? err.message : err);
    res.status(500).json({ message: 'Failed to fetch procedures for location' });
  }
}
