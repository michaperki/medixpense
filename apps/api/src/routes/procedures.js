
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
  deleteProcedurePrice
} from '../controllers/proceduresController.js';

const router = express.Router();

// Public
router.get('/categories', getCategories);
router.get('/templates', getTemplates);

// Provider (auth + role only)
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

// fallback GET /:id
router.get(
  '/:id',
  verifyToken,
  checkRole(['PROVIDER']),
  getProcedurePrice
);

export default router;

