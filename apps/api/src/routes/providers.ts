// apps/api/src/routes/providers.js
import express from 'express';
import { verifyToken, checkRole } from '../middleware/auth.js';
import {
  getProviderByUserId,
  getProviderProcedures,
  getProviderById, // Public method for getting provider details
  getSpecialties
} from '../controllers/providersController';

const router = express.Router();

// Public routes (no authentication required)
router.get('/specialties', getSpecialties);
router.get('/details/:id', getProviderById); // Changed path to avoid conflict

// Protected routes (authentication required)
router.get('/user/:userId', verifyToken, getProviderByUserId);
router.get('/:providerId/procedures', verifyToken, getProviderProcedures);

export default router;
