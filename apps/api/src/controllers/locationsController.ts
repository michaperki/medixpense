import { prisma } from '@packages/database';
import { Request, Response } from 'express';

/**
 * POST /api/locations
 */
export async function createLocation(req: Request, res: Response): Promise<void> {
  try {
    const providerId = req.user?.provider?.id;

    const loc = await prisma.location.create({
      data: {
        name: req.body.name,
        address1: req.body.address1,
        address2: req.body.address2,
        city: req.body.city,
        state: req.body.state,
        zipCode: req.body.zipCode,
        phone: req.body.phone,
        isActive: req.body.isActive,
        providerId
      }
    });

    res.status(201).json({ location: loc });
  } catch (err) {
    console.error('Error creating location:', err);
    res.status(500).json({ message: 'Error creating location' });
  }
}

/**
 * GET /api/locations?page=&limit=
 */
export async function getLocations(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const providerId = req.user?.provider?.id;

    const [rows, total] = await Promise.all([
      prisma.location.findMany({
        where: { providerId },
        skip,
        take: limit,
        include: { _count: { select: { procedures: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.location.count({ where: { providerId } })
    ]);

    const pages = Math.ceil(total / limit);
    const locations = rows.map((loc: typeof rows[number]) => ({
      ...loc,
      procedureCount: loc._count.procedures
    }));

    res.json({ locations, pagination: { page, limit, total, pages } });
  } catch (err) {
    console.error('Error fetching locations:', err);
    res.status(500).json({ message: 'Error fetching locations' });
  }
}

/**
 * GET /api/locations/:id
 */
export async function getLocationById(req: Request, res: Response): Promise<void> {
  try {
    const loc = await prisma.location.findFirst({
      where: {
        id: req.params.id,
        providerId: req.user?.provider?.id
      },
      include: { procedures: true }
    });

    if (!loc) {
      res.status(404).json({ message: 'Not found' });
      return;
    }

    res.json({ location: loc });
  } catch (err) {
    console.error('Error fetching location:', err);
    res.status(500).json({ message: 'Error fetching location' });
  }
}

/**
 * PUT /api/locations/:id
 */
export async function updateLocation(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const providerId = req.user?.provider?.id;

    const data = {
      name: req.body.name,
      address1: req.body.address1,
      address2: req.body.address2,
      city: req.body.city,
      state: req.body.state,
      zipCode: req.body.zipCode,
      phone: req.body.phone,
      isActive: req.body.isActive
    };

    const result = await prisma.location.updateMany({
      where: { id, providerId },
      data
    });

    if (result.count === 0) {
      res.status(404).json({ message: 'Not found or no permission' });
      return;
    }

    const updated = await prisma.location.findUnique({ where: { id } });
    res.json({ location: updated });
  } catch (err) {
    console.error('Error updating location:', err);
    res.status(500).json({ message: 'Error updating location' });
  }
}

/**
 * DELETE /api/locations/:id
 */
export async function deleteLocation(req: Request, res: Response): Promise<void> {
  try {
    const providerId = req.user?.provider?.id;

    const result = await prisma.location.deleteMany({
      where: { id: req.params.id, providerId }
    });

    if (result.count === 0) {
      res.status(404).json({ message: 'Not found or no permission' });
      return;
    }

    res.status(204).end();
  } catch (err) {
    console.error('Error deleting location:', err);
    res.status(500).json({ message: 'Error deleting location' });
  }
}
