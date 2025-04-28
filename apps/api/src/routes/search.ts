
// apps/api/src/routes/search.ts
import express from 'express';
import {
  getProcedures,
  getStats,
  getProviders
} from '../controllers/searchController';

const router = express.Router();

router.get('/procedures', getProcedures);
router.get('/stats/:templateId', getStats);
router.get('/providers', getProviders);

export default router;

