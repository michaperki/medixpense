import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { prisma } from '@packages/database';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('JWT_SECRET environment variable is not set!');
  process.exit(1);
}

// Define user shape attached to req.user
interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  status: string;
  provider?: {
    id: string;
    subscriptionStatus: string;
  };
}

export const generateToken = (user: { id: string; email: string; role: string }) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET!,
    { expiresIn: '7d' }
  );
};

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Unauthorized: No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET!) as JwtPayload & { id: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        provider: {
          select: {
            id: true,
            subscriptionStatus: true,
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      res.status(401).json({ message: 'Unauthorized: User inactive or not found' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: 'Unauthorized: Invalid token' });
      return;
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const checkRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized: No user found' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
      return;
    }

    next();
  };
};

export const checkSubscription = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.provider) {
    res.status(403).json({ message: 'Forbidden: User is not a provider' });
    return;
  }

  if (
    req.user.provider.subscriptionStatus !== 'ACTIVE' &&
    req.user.provider.subscriptionStatus !== 'TRIAL'
  ) {
    res.status(403).json({ message: 'Forbidden: Active subscription required' });
    return;
  }

  next();
};
