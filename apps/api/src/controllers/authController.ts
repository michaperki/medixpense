// apps/api/src/controllers/authController.ts

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth.js';
import { prisma } from '@packages/database';

/**
 * POST /api/auth/register
 */
export async function signupController(req: Request, res: Response): Promise<void> {
  const { email, password, firstName, lastName } = req.body;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ message: 'Email already in use' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        role: 'PROVIDER',
        status: 'ACTIVE'
      }
    });

    const token = generateToken(user);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      token
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * POST /api/auth/login
 */
export async function loginController(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.status !== 'ACTIVE') {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      console.log('Password validation failed for:', email);
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const token = generateToken(user);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}
