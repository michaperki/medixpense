// apps/api/src/validation/settings.js
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.js';

/**
 * Validate settings update request
 */
export const validateSettingsUpdate = [
  body('settingsType')
    .isString()
    .isIn(['general', 'notifications', 'security', 'billing'])
    .withMessage('Invalid settings type'),
  
  // General settings validation
  body('language')
    .optional()
    .isString()
    .isIn(['en', 'es', 'fr'])
    .withMessage('Invalid language'),
  
  body('timeZone')
    .optional()
    .isString()
    .withMessage('Invalid time zone'),
  
  body('dateFormat')
    .optional()
    .isString()
    .isIn(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'])
    .withMessage('Invalid date format'),
  
  // Notification settings validation
  body('emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('Email notifications must be a boolean'),
  
  body('smsNotifications')
    .optional()
    .isBoolean()
    .withMessage('SMS notifications must be a boolean'),
  
  body('marketingEmails')
    .optional()
    .isBoolean()
    .withMessage('Marketing emails must be a boolean'),
  
  // Security settings validation
  body('twoFactorEnabled')
    .optional()
    .isBoolean()
    .withMessage('Two-factor enabled must be a boolean'),
  
  body('sessionTimeout')
    .optional()
    .isInt({ min: 5, max: 240 })
    .withMessage('Session timeout must be between 5 and 240 minutes'),
  
  // Billing settings validation
  body('autoRenew')
    .optional()
    .isBoolean()
    .withMessage('Auto renew must be a boolean'),
  
  validateRequest
];

/**
 * Validate password change request
 */
export const validatePasswordChange = [
  body('currentPassword')
    .isString()
    .isLength({ min: 8 })
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isString()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('confirmPassword')
    .isString()
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  
  validateRequest
];
