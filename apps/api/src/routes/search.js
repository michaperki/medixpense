
// apps/api/src/routes/search.js
import express from 'express';
import {
  getProcedures,
  getStats,
  getProviders
} from '../controllers/searchController.js';

const router = express.Router();

router.get('/procedures', getProcedures);
router.get('/stats/:templateId', getStats);
router.get('/providers', getProviders);

export default router;

