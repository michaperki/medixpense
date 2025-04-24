// src/services/index.ts

// Import all services
import authService from './authService';
import locationService from './locationService';
import notificationService from './notificationService';
import procedureService from './procedureService';
import searchService from './searchService';

// Re-export types from each service
export type { User, LoginRequest, RegisterRequest, 
  UpdateProfileRequest, ChangePasswordRequest, 
  AuthResponse } from './authService';

export type { 
  Location, 
  LocationPaginatedResponse, 
  LocationParams,
  LocationCreateData 
} from './locationService';

export type { 
  Procedure, 
  ProcedureTemplate, 
  ProcedureCategory,
  ProcedurePaginatedResponse
} from './procedureService';

// Export all services
export {
  authService,
  locationService,
  notificationService,
  procedureService,
  searchService
};
