
import { prisma } from '@packages/database';
import { Request, Response } from 'express';

/**
 * POST /api/locations
 */
export async function createLocation(req: Request, res: Response) {
  try {
    // Ensure the user and provider are available in req.user
    const providerId = req.user.provider.id;

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
        providerId: providerId
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
export async function getLocations(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Ensure the user and provider are available in req.user
    const providerId = req.user.provider.id;

    const [rows, total] = await Promise.all([
      prisma.location.findMany({
        where: { providerId: providerId },
        skip,
        take: limit,
        include: { _count: { select: { procedures: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.location.count({ where: { providerId: providerId } })
    ]);

    const pages = Math.ceil(total / limit);
    const locations = rows.map((loc) => ({
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
export async function getLocationById(req: Request, res: Response) {
  try {
    const loc = await prisma.location.findFirst({
      where: {
        id: req.params.id,
        providerId: req.user.provider.id
      },
      include: { procedures: true }
    });
    if (!loc) return res.status(404).json({ message: 'Not found' });
    res.json({ location: loc });
  } catch (err) {
    console.error('Error fetching location:', err);
    res.status(500).json({ message: 'Error fetching location' });
  }
}

/**
 * PUT /api/locations/:id
 */
export async function updateLocation(req: Request, res: Response) {
  try {
    const { id } = req.params;
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

    // Ensure the user and provider are available in req.user
    const providerId = req.user.provider.id;

    const result = await prisma.location.updateMany({
      where: { id, providerId: providerId },
      data
    });
    if (result.count === 0) return res.status(404).json({ message: 'Not found or no permission' });

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
export async function deleteLocation(req: Request, res: Response) {
  try {
    // Ensure the user and provider are available in req.user
    const providerId = req.user.provider.id;

    const result = await prisma.location.deleteMany({
      where: { id: req.params.id, providerId: providerId }
    });
    if (result.count === 0) return res.status(404).json({ message: 'Not found or no permission' });
    res.status(204).end();
  } catch (err) {
    console.error('Error deleting location:', err);
    res.status(500).json({ message: 'Error deleting location' });
  }
}

