// apps/api/src/validation/profile.js
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.js';

/**
 * Validate profile update request
 */
export const validateProfileUpdate = [
  body('organizationName')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Organization name must be between 1 and 100 characters'),
  
  body('bio')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  
  body('phone')
    .optional()
    .isString()
    .trim()
    .matches(/^(\+\d{1,3})?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('website')
    .optional()
    .isURL()
    .withMessage('Please provide a valid URL'),
  
  body('address')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address cannot exceed 200 characters'),
  
  body('city')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City cannot exceed 100 characters'),
  
  body('state')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('State cannot exceed 100 characters'),
  
  body('zipCode')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 20 })
    .withMessage('ZIP code cannot exceed 20 characters'),
  
  validateRequest
];
