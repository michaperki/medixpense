// src/services/providerService.ts
import apiClient from '@/lib/apiClient';
import { getLogger } from '@/lib/logger';
import { handleApiError } from '@/lib/api/handleApiError';

const logger = getLogger('provider:service');

// Types
export interface Provider {
  id: string;
  name: string;
  organizationName?: string;
  description?: string;
  mission?: string;
  logoUrl?: string;
  website?: string;
  phone?: string;
  email?: string;
  yearEstablished?: number;
  licensingInfo?: string;
  insuranceAccepted?: string[];
  specialties?: string[];
  services?: string[];
  reviewCount?: number;
  rating?: number;
  locations: Location[];
  procedures?: Procedure[];
}

export interface Location {
  id: string;
  name?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  hours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
}

export interface Procedure {
  id: string;
  name: string;
  description?: string;
  price: number;
  savingsPercent?: number;
  category: {
    id: string;
    name: string;
  };
}

export interface ProviderListItem {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  phone?: string;
  reviewCount?: number;
  rating?: number;
  location: {
    id: string;
    city: string;
    state: string;
    zipCode?: string;
    address1?: string;
    latitude?: number;
    longitude?: number;
  };
  procedureCount?: number;
  specialties?: string[];
  distance?: number;
}

export interface ProviderSearchParams {
  query?: string;
  location?: string;
  distance?: string;
  specialty?: string;
  sort?: string;
  page?: string;
  limit?: string;
}

export interface ProviderDetailResponse {
  provider: Provider;
}

export interface ProviderSearchResponse {
  providers: ProviderListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  data?: {
    searchLocation?: {
      latitude: number;
      longitude: number;
    }
  }
}

export interface SpecialtiesResponse {
  specialties: string[];
}

export class ProviderService {
  /**
   * Get a provider by ID with full details
   */
  async getProviderById(id: string): Promise<ProviderDetailResponse> {
    logger.debug('Fetching provider by ID', { id });
    return apiClient.get<ProviderDetailResponse>(`/providers/details/${id}`) // Updated path
      .catch((error) => handleApiError(error, 'getProviderById'));
  }

  /**
   * Search for providers
   */
  async searchProviders(params: ProviderSearchParams): Promise<ProviderSearchResponse> {
    logger.debug('Searching providers', { params });
    return apiClient.get<ProviderSearchResponse>('/search/providers', { params })
      .catch((error) => handleApiError(error, 'searchProviders'));
  }

  /**
   * Get all medical specialties
   */
  async getSpecialties(): Promise<SpecialtiesResponse> {
    logger.debug('Fetching specialties');
    return apiClient.get<SpecialtiesResponse>('/providers/specialties')
      .catch((error) => handleApiError(error, 'getSpecialties'));
  }
}

export const providerService = new ProviderService();
export default providerService;
