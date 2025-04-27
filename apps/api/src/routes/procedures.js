// apps/api/src/routes/procedures.js
import express from 'express';
import { verifyToken, checkRole } from '../middleware/auth.js';
import { validateProcedure } from '../validation/procedures.js';
import {
  getCategories,
  getTemplates,
  getProviderProcedures,
  getProcedurePrice,
  createProcedurePrice,
  updateProcedurePrice,
  deleteProcedurePrice,
  getProcedureById // Import our new controller function
} from '../controllers/proceduresController.js';

const router = express.Router();

// Public routes - no authentication required
router.get('/categories', getCategories);
router.get('/templates', getTemplates);

// IMPORTANT: This route must come before any other routes with parameters
// to avoid conflicts. Make it public (no auth) so users can view procedure details
router.get('/:id', getProcedureById);

// Provider routes - authentication required
router.get(
  '/provider',
  verifyToken,
  checkRole(['PROVIDER']),
  getProviderProcedures
);
router.get(
  '/price/:id',
  verifyToken,
  checkRole(['PROVIDER']),
  getProcedurePrice
);
router.post(
  '/price',
  verifyToken,
  checkRole(['PROVIDER']),
  validateProcedure,
  createProcedurePrice
);
router.put(
  '/price/:id',
  verifyToken,
  checkRole(['PROVIDER']),
  updateProcedurePrice
);
router.delete(
  '/price/:id',
  verifyToken,
  checkRole(['PROVIDER']),
  deleteProcedurePrice
);

export default router;
