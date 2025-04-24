
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getProviderByUserId = async (req, res) => {
  const { userId } = req.params;
  const provider = await prisma.provider.findUnique({ where: { userId } });
  if (!provider) return res.status(404).json({ message: 'Provider not found' });
  res.json(provider);
};

export const getProviderProcedures = async (req, res) => {
  const { providerId } = req.params;

  try {
    const procedures = await prisma.procedurePrice.findMany({
      where: {
        location: {
          providerId: providerId,
        },
      },
      include: {
        template: {
          include: {
            category: true,
          },
        },
      },
    });

    res.json(procedures);
  } catch (err) {
    console.error('Error fetching provider procedures:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
