import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { validateProfileUpdate } from '../validation/profile.js';
import { 
  getProviderProfile,
  updateProviderProfile,
  uploadProviderLogo,
  getPublicProviderProfile 
} from '../controllers/profileController';
import multer from 'multer';

// Set up multer for file uploads
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, callback) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      callback(null, true);
    } else {
      // According to @types/multer, we need to pass null as the first argument
      // even when rejecting the file (second argument is false)
      callback(null, false);
      // We can handle the error message in the route handler instead
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
