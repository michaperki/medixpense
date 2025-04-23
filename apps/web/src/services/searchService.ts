
// src/services/searchService.ts
import apiClient from '@/lib/apiClient';
import { Procedure, PriceStats } from './procedureService';

// Types
export interface SearchParams {
  query?: string;
  location?: string;
  procedureId?: string;
  categoryId?: string;
  distance?: string;
  sort?: string;
  page?: string;
  limit?: string;
  price_min?: string;
  price_max?: string;
}

export interface SearchResponse {
  results: Procedure[];
  stats?: PriceStats;
  procedureName?: string;
  searchLocation?: {
    latitude: number;
    longitude: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface Provider {
  id: string;
  name: string;
  description?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  locations: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    latitude: number;
    longitude: number;
  }[];
}

export interface ProvidersResponse {
  providers: Provider[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Search Service
export class SearchService {
  async searchProcedures(params: SearchParams): Promise<SearchResponse> {
    return apiClient.get<SearchResponse>('/search/procedures', { params });
  }

  async getStats(templateId: string, params?: {
    locationId?: string;
    radius?: number;
  }): Promise<{ stats: PriceStats }> {
    return apiClient.get<{ stats: PriceStats }>(`/search/stats/${templateId}`, { params });
  }

  async searchProviders(params: {
    query?: string;
    location?: string;
    distance?: string;
    page?: string;
    limit?: string;
  }): Promise<ProvidersResponse> {
    return apiClient.get<ProvidersResponse>('/search/providers', { params });
  }
}

export const searchService = new SearchService();

