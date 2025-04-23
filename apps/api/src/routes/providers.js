
import express from 'express';
import { getProviderByUserId, getProviderProcedures } from '../controllers/providersController.js';

const router = express.Router();

router.get('/user/:userId', getProviderByUserId);
router.get('/:providerId/procedures', getProviderProcedures);

export default router;
