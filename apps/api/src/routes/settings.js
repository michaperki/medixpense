// apps/api/src/routes/settings.js
import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { 
  validateSettingsUpdate,
  validatePasswordChange 
} from '../validation/settings.js';
import { 
  getProviderSettings,
  updateProviderSettings,
  changePassword,
  enableTwoFactor,
  verifyTwoFactor,
  disableTwoFactor
} from '../controllers/settingsController';

const router = express.Router();

// Settings Routes (all protected)
router.get('/provider', verifyToken, getProviderSettings);
router.put('/provider', verifyToken, validateSettingsUpdate, updateProviderSettings);
router.post('/change-password', verifyToken, validatePasswordChange, changePassword);

// Two-factor authentication
router.post('/two-factor/enable', verifyToken, enableTwoFactor);
router.post('/two-factor/verify', verifyToken, verifyTwoFactor);
router.post('/two-factor/disable', verifyToken, disableTwoFactor);

export default router;
