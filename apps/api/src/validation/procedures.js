
// apps/api/src/validation/procedures.js
import { body, validationResult } from 'express-validator';

export const validateProcedure = [
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
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
