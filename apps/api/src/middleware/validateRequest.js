// apps/api/src/middleware/validateRequest.js
import { validationResult } from 'express-validator';

/**
 * Middleware to validate request data using express-validator
 * This checks for validation errors and returns a standardized error response
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
export function validateRequest(req, res, next) {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Extract and format validation errors
    const formattedErrors = {};
    
    errors.array().forEach(error => {
      if (!formattedErrors[error.path]) {
        formattedErrors[error.path] = [];
      }
      formattedErrors[error.path].push(error.msg);
    });
    
    // Return 400 Bad Request with formatted errors
    return res.status(400).json({
      message: 'Validation failed',
      errors: formattedErrors
    });
  }
  
  // No validation errors, proceed to the next middleware/controller
  next();
}
