import express from 'express';
import { Request, Response } from 'express';
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
// Wrap all controller handlers in anonymous functions to satisfy TypeScript's return type requirements
router.get('/provider', verifyToken, (req: Request, res: Response) => {
  getProviderSettings(req, res);
});

router.put('/provider', verifyToken, validateSettingsUpdate, (req: Request, res: Response) => {
  updateProviderSettings(req, res);
});

router.post('/change-password', verifyToken, validatePasswordChange, (req: Request, res: Response) => {
  changePassword(req, res);
});

// Two-factor authentication
router.post('/two-factor/enable', verifyToken, (req: Request, res: Response) => {
  enableTwoFactor(req, res);
});

router.post('/two-factor/verify', verifyToken, (req: Request, res: Response) => {
  verifyTwoFactor(req, res);
});

router.post('/two-factor/disable', verifyToken, (req: Request, res: Response) => {
  disableTwoFactor(req, res);
});

export default router;
