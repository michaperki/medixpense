
import express from 'express';
import {
  createLocation,
  getLocations,
  getLocationById,
  updateLocation,
  deleteLocation
} from '../controllers/locationsController';
import { getProceduresByLocation } from '../controllers/proceduresController';
import { verifyToken, checkRole, checkSubscription } from '../middleware/auth.js';

const router = express.Router();

// More specific route first
router.get(
  '/:locationId/procedures',
  verifyToken,
  checkRole(['PROVIDER']),
  checkSubscription,
  getProceduresByLocation
);

router.get('/',     verifyToken, checkRole(['PROVIDER']), checkSubscription, getLocations);
router.get('/:id',  verifyToken, checkRole(['PROVIDER']), checkSubscription, getLocationById);
router.post('/',    verifyToken, checkRole(['PROVIDER']), checkSubscription, createLocation);
router.put('/:id',  verifyToken, checkRole(['PROVIDER']), checkSubscription, updateLocation);
router.delete('/:id', verifyToken, checkRole(['PROVIDER']), checkSubscription, deleteLocation);

export default router;

