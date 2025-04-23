// src/services/locationService.ts
import apiClient from '@/lib/apiClient';

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
    console.log('LocationService: Fetching locations with params:', params);
    
    try {
      const result = await apiClient.get('/locations', {
        params
      });
      
      console.log('LocationService: Raw API response:', result);
      
      // Already in the expected format
      return result;
    } catch (error) {
      console.error('LocationService: Error fetching locations:', error);
      throw error;
    }
  },

  // Get a single location by ID
  getById: async (id: string): Promise<Location> => {
    try {
      const result = await apiClient.get(`/locations/${id}`);
      return result.location || result;
    } catch (error) {
      console.error(`LocationService: Error fetching location with ID ${id}:`, error);
      throw error;
    }
  },

  // Create a new location
  create: async (data: LocationCreateData): Promise<Location> => {
    try {
      const result = await apiClient.post('/locations', data);
      return result.location || result;
    } catch (error) {
      console.error('LocationService: Error creating location:', error);
      throw error;
    }
  },

  // Update an existing location
  update: async (id: string, data: Partial<LocationCreateData>): Promise<Location> => {
    try {
      const result = await apiClient.put(`/locations/${id}`, data);
      return result.location || result;
    } catch (error) {
      console.error(`LocationService: Error updating location with ID ${id}:`, error);
      throw error;
    }
  },

  // Delete a location
  delete: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/locations/${id}`);
    } catch (error) {
      console.error(`LocationService: Error deleting location with ID ${id}:`, error);
      throw error;
    }
  }
};

export default locationService;
