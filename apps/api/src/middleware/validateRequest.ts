import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * Middleware to validate request data using express-validator
 * This checks for validation errors and returns a standardized error response
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next middleware function
 * @returns void
 */
export function validateRequest(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Extract and format validation errors
    const formattedErrors: Record<string, string[]> = {};
    
    // Use type assertion with a more generic approach to handle different versions of express-validator
    errors.array().forEach((error: any) => {
      // Try to get the field name from various possible properties
      // Different versions of express-validator use different property names
      const field = error.path || error.param || error.location?.path || 'general';
      
      if (!formattedErrors[field]) {
        formattedErrors[field] = [];
      }
      
      formattedErrors[field].push(error.msg);
    });
    
    // Return 400 Bad Request with formatted errors
    res.status(400).json({
      message: 'Validation failed',
      errors: formattedErrors
    });
    return;
  }
  
  // No validation errors, proceed to the next middleware/controller
  next();
}
