// src/routes/procedures.js
import express from 'express';
import { verifyToken, checkRole, checkSubscription } from '../middleware/auth.js';
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

// Public routes
router.get('/categories', getCategories);
router.get('/templates', getTemplates);

// Provider routes - require authentication
router.get('/provider', getProviderProcedures);
router.get('/price/:id', verifyToken, checkRole(['PROVIDER']), getProcedurePrice);
router.post('/price', verifyToken, checkRole(['PROVIDER']), validateProcedure, createProcedurePrice);
router.put('/price/:id', verifyToken, checkRole(['PROVIDER']), updateProcedurePrice);
router.delete('/price/:id', verifyToken, checkRole(['PROVIDER']), deleteProcedurePrice);

// must come after /price/:id so it doesn’t steal that path
router.get(
  '/:id',
  verifyToken,
  checkRole(['PROVIDER']),
  getProcedurePrice
);

export default router;
