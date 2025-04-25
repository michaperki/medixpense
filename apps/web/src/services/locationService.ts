// src/services/locationService.ts
import apiClient from '@/lib/apiClient';
import { getLogger } from '@/lib/logger';

// Create a location-specific logger
const locationLogger = getLogger('location:service');

export interface Location {
  id: string;
  providerId: string;
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  procedureCount?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LocationPaginatedResponse {
  locations: Location[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface LocationParams {
  page?: number;
  limit?: number;
}

export interface LocationCreateData {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  isActive?: boolean;
}

const locationService = {
  // Get all locations with pagination
  getAll: async (params: LocationParams = {}): Promise<LocationPaginatedResponse> => {
    const t = locationLogger.timer('Fetch all locations');
    try {
      const result = await apiClient.get('/locations', { params });
      locationLogger.debug('Locations fetched successfully', { 
        count: result.locations?.length,
        pagination: result.pagination
      });
      t.done();
      return result;
    } catch (error) {
      t.fail(error);
      throw error;
    }
  },
  
  // Get a single location by ID
  getById: async (id: string): Promise<Location> => {
    locationLogger.debug('Fetching location by ID', { id });
    
    try {
      const result = await apiClient.get(`/locations/${id}`);
      locationLogger.debug('Raw response from API', { result }); // <-- Add this
      const location = result?.location ?? result;

      if (!location?.id) {
        locationLogger.error('Invalid location response', { result }); // <-- Make sure this is here
        throw new Error('Invalid location response');
      }

      locationLogger.debug('Location fetched successfully', { id, name: location.name });
      return location;
    } catch (error) {
      locationLogger.error(`Failed to fetch location`, { id, error });
      throw error;
    }
  },
  
  // Create a new location
  create: async (data: LocationCreateData): Promise<Location> => {
    locationLogger.info('Creating new location', { 
      name: data.name,
      city: data.city,
      state: data.state
    });
    
    try {
      const result = await apiClient.post('/locations', data);
      const location = result.location || result;
      
      locationLogger.info('Location created successfully', {
        id: location.id,
        name: location.name
      });
      
      return location;
    } catch (error) {
      locationLogger.error('Failed to create location', { 
        name: data.name,
        error
      });
      throw error;
    }
  },
  
  // Update an existing location
  update: async (id: string, data: Partial<LocationCreateData>): Promise<Location> => {
    locationLogger.info('Updating location', { 
      id,
      fields: Object.keys(data)
    });
    
    try {
      const result = await apiClient.put(`/locations/${id}`, data);
      const location = result.location || result;
      
      locationLogger.info('Location updated successfully', {
        id,
        name: location.name
      });
      
      return location;
    } catch (error) {
      locationLogger.error('Failed to update location', {
        id,
        error
      });
      throw error;
    }
  },
  
  // Delete a location
  delete: async (id: string): Promise<void> => {
    locationLogger.info('Deleting location', { id });
    
    try {
      await apiClient.delete(`/locations/${id}`);
      locationLogger.info('Location deleted successfully', { id });
    } catch (error) {
      locationLogger.error('Failed to delete location', {
        id,
        error
      });
      throw error;
    }
  }
};

export default locationService;
