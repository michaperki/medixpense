
import express from 'express';
import { validateSignup, validateLogin } from '../validation/auth.js';
import { signupController, loginController } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', validateSignup, signupController);
router.post('/login',    validateLogin,  loginController);

export default router;

