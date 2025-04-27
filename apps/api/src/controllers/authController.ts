
// apps/api/src/controllers/authController.js

import bcrypt from 'bcrypt';
import { generateToken } from '../middleware/auth.js';

import { prisma } from '@packages/database'
/**
 * POST /api/auth/register
 */
export async function signupController(req, res) {
  const { email, password, firstName, lastName } = req.body;

  try {
    // 1. Reject if email already exists
    const existing = await prisma.user.findUnique({
      where: { email }
    });
    if (existing) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create new user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        role: 'PROVIDER',  // adjust default as needed
        status: 'ACTIVE'
      }
    });

    // 4. Issue JWT
    const token = generateToken(user);

    // 5. Return user info + token
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
export async function loginController(req, res) {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.status !== 'ACTIVE') {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // 3. Verify password
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      console.log('Password validation failed for:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // 4. Issue JWT
    const token = generateToken(user);

    // 5. Return user info + token
    return res.json({
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
    return res.status(500).json({ message: 'Internal server error' });
  }
}

