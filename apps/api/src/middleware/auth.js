// apps/api/src/middleware/auth.js
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('JWT_SECRET environment variable is not set!');
  process.exit(1); // Exit if JWT_SECRET is not set
}

export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};


export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user exists and is active
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
            subscriptionStatus: true
          }
        }
      }
    });
    
    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ message: 'Unauthorized: User inactive or not found' });
    }
    
    // Add user info to request object
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized: No user found' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }
    
    next();
  };
};

export const checkSubscription = (req, res, next) => {
  if (!req.user || !req.user.provider) {
    return res.status(403).json({ message: 'Forbidden: User is not a provider' });
  }
  
  if (req.user.provider.subscriptionStatus !== 'ACTIVE' && 
      req.user.provider.subscriptionStatus !== 'TRIAL') {
    return res.status(403).json({ message: 'Forbidden: Active subscription required' });
  }
  
  next();
};

