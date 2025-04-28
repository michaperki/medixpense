import express from 'express';
import { verifyToken, checkRole } from '../middleware/auth.js';
import { validateProcedureRules } from '../validation/procedures.js';
import { handleValidationErrors } from '../middleware/validateMiddleware';
import {
  getCategories,
  getTemplates,
  getProviderProcedures,
  getProcedurePrice,
  createProcedurePrice,
  updateProcedurePrice,
  deleteProcedurePrice,
  getProcedureById
} from '../controllers/proceduresController';

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

// Fix the route causing TypeScript errors by separating validation rules from handler
router.post(
  '/price',
  verifyToken,
  checkRole(['PROVIDER']),
  validateProcedureRules,
  handleValidationErrors,
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
