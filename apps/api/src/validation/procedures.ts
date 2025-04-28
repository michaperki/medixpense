import { body, ValidationChain } from 'express-validator';

// Export only the validation rules array, not including the validation handler
export const validateProcedureRules: ValidationChain[] = [
  body('locationId')
    .isUUID()
    .withMessage('Valid location ID is required'),
  
  body('templateId')
    .isUUID()
    .withMessage('Valid template ID is required')
    .optional({ nullable: true, checkFalsy: true }),
  
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('comments')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Comments must be less than 500 characters'),
];
