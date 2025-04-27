
import apiClient from '@/lib/apiClient';
import { getLogger } from '@/lib/logger';
import { handleApiError } from '@/lib/api/handleApiError';

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
  async getAll(params: LocationParams = {}): Promise<LocationPaginatedResponse> {
    const t = locationLogger.timer('Fetch all locations');
    try {
      const result = await apiClient.get<LocationPaginatedResponse>('/locations', { params });
      locationLogger.debug('Locations fetched successfully', { 
        count: result.locations?.length,
        pagination: result.pagination,
      });
      t.done();
      return result;
    } catch (error) {
      t.fail(error);
      return handleApiError(error, 'getAllLocations');
    }
  },

  async getById(id: string): Promise<Location> {
    locationLogger.debug('Fetching location by ID', { id });
    return apiClient.get<{ location: Location }>(`/locations/${id}`)
      .then((result) => {
        const location = result.location ?? result;
        if (!location?.id) {
          locationLogger.error('Invalid location response', { result });
          throw new Error('Invalid location response');
        }
        locationLogger.debug('Location fetched successfully', { id, name: location.name });
        return location;
      })
      .catch((error) => handleApiError(error, 'getLocationById'));
  },

  async create(data: LocationCreateData): Promise<Location> {
    locationLogger.info('Creating new location', { 
      name: data.name,
      city: data.city,
      state: data.state,
    });
    return apiClient.post<{ location: Location }>('/locations', data)
      .then((result) => {
        const location = result.location ?? result;
        locationLogger.info('Location created successfully', {
          id: location.id,
          name: location.name,
        });
        return location;
      })
      .catch((error) => handleApiError(error, 'createLocation'));
  },

  async update(id: string, data: Partial<LocationCreateData>): Promise<Location> {
    locationLogger.info('Updating location', { id, fields: Object.keys(data) });
    return apiClient.put<{ location: Location }>(`/locations/${id}`, data)
      .then((result) => {
        const location = result.location ?? result;
        locationLogger.info('Location updated successfully', { id, name: location.name });
        return location;
      })
      .catch((error) => handleApiError(error, 'updateLocation'));
  },

  async delete(id: string): Promise<void> {
    locationLogger.info('Deleting location', { id });
    return apiClient.delete<void>(`/locations/${id}`)
      .then(() => {
        locationLogger.info('Location deleted successfully', { id });
      })
      .catch((error) => handleApiError(error, 'deleteLocation'));
  },
};

export default locationService;

