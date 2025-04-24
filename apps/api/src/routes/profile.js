// apps/api/src/routes/profile.js
import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { validateProfileUpdate } from '../validation/profile.js';
import { 
  getProviderProfile,
  updateProviderProfile,
  uploadProviderLogo,
  getPublicProviderProfile 
} from '../controllers/profileController.js';
import multer from 'multer';

// Set up multer for file uploads
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

const router = express.Router();

// Protected Routes (require authentication)
router.get('/provider', verifyToken, getProviderProfile);
router.put('/provider', verifyToken, validateProfileUpdate, updateProviderProfile);
router.post('/provider/logo', verifyToken, upload.single('logo'), uploadProviderLogo);

// Public Routes
router.get('/provider/:providerId/public', getPublicProviderProfile);

export default router;
