// src/services/searchService.ts
import apiClient from '@/lib/apiClient';
import { getLogger } from '@/lib/logger';
import { Procedure, PriceStats } from './procedureService';

// Create a search-specific logger
const searchLogger = getLogger('search:service');

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
    searchLogger.info('Searching procedures', { 
      query: params.query,
      location: params.location,
      distance: params.distance,
      procedureId: params.procedureId,
      categoryId: params.categoryId
    });
    
    try {
      return await searchLogger.time('Search procedures', async () => {
        const result = await apiClient.get<SearchResponse>('/search/procedures', { params });
        
        searchLogger.info('Procedure search completed', { 
          resultCount: result.results?.length,
          procedureName: result.procedureName,
          hasLocation: !!result.searchLocation
        });
        
        return result;
      });
    } catch (error) {
      searchLogger.error('Failed to search procedures', { params, error });
      throw error;
    }
  }

  async getStats(templateId: string, params?: {
    locationId?: string;
    radius?: number;
  }): Promise<{ stats: PriceStats }> {
    searchLogger.debug('Fetching procedure stats', { 
      templateId, 
      locationId: params?.locationId,
      radius: params?.radius
    });
    
    try {
      const result = await apiClient.get<{ stats: PriceStats }>(`/search/stats/${templateId}`, { params });
      
      searchLogger.debug('Procedure stats fetched successfully', { 
        templateId,
        min: result.stats?.min,
        max: result.stats?.max,
        average: result.stats?.average
      });
      
      return result;
    } catch (error) {
      searchLogger.error('Failed to fetch procedure stats', { templateId, params, error });
      throw error;
    }
  }

  async searchProviders(params: {
    query?: string;
    location?: string;
    distance?: string;
    page?: string;
    limit?: string;
  }): Promise<ProvidersResponse> {
    searchLogger.info('Searching providers', { 
      query: params.query,
      location: params.location,
      distance: params.distance,
      page: params.page,
      limit: params.limit
    });
    
    try {
      return await searchLogger.time('Search providers', async () => {
        const result = await apiClient.get<ProvidersResponse>('/search/providers', { params });
        
        searchLogger.info('Provider search completed', { 
          providerCount: result.providers?.length,
          pagination: result.pagination
        });
        
        return result;
      });
    } catch (error) {
      searchLogger.error('Failed to search providers', { params, error });
      throw error;
    }
  }
}

export const searchService = new SearchService();
