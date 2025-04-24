import apiClient from '@/lib/apiClient';
import { getLogger } from '@/lib/logger';

// Create a procedure-specific logger
const procedureLogger = getLogger('procedure:service');

// Types
export interface ProcedureCategory {
  id: string;
  name: string;
  description?: string;
}

export interface ProcedureTemplate {
  id: string;
  name: string;
  description?: string;
  category: ProcedureCategory;
}

export interface Procedure {
  id: string;
  price: number;
  location: {
    id: string;
    name: string;
    address1: string;
    city: string;
    state: string;
    zipCode: string;
    latitude?: number;
    longitude?: number;
    provider?: {
      id: string;
      name: string;
      rating?: number;
      reviewCount?: number;
    };
  };
  template: {
    id: string;
    name: string;
    description?: string;
    category: {
      id: string;
      name: string;
    };
  };
}

export interface CreateProcedureRequest {
  locationId: string;
  templateId: string;
  price: number;
}

export interface UpdateProcedureRequest {
  price: number;
}

export interface BulkUpdatePriceRequest {
  procedureIds: string[];
  percentageChange: number;
}

export interface CategoriesResponse {
  categories: ProcedureCategory[];
}

export interface TemplatesResponse {
  templates: ProcedureTemplate[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ProceduresResponse {
  procedures: Procedure[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ProcedureResponse {
  procedure: Procedure;
}

export interface PriceStats {
  min: number;
  max: number;
  average: number;
  median: number;
}

export interface StatsResponse {
  stats: PriceStats;
}

// Procedure Service
export class ProcedureService {
  /**
   * Get all available procedure categories
   */
  async getCategories(): Promise<CategoriesResponse> {
    procedureLogger.debug('Fetching procedure categories');
    
    try {
      const result = await apiClient.get<CategoriesResponse>('/procedures/categories');
      
      procedureLogger.debug('Categories fetched successfully', { 
        count: result.categories?.length 
      });
      
      return result;
    } catch (error) {
      procedureLogger.error('Failed to fetch procedure categories', error);
      throw error;
    }
  }

  /**
   * Get procedure templates with optional filtering
   */
  async getTemplates(params?: { 
    query?: string; 
    categoryId?: string;
    page?: number;
    limit?: number;
  }): Promise<TemplatesResponse> {
    procedureLogger.debug('Fetching procedure templates', { params });
    
    try {
      const result = await apiClient.get<TemplatesResponse>('/procedures/templates', { params });
      
      procedureLogger.debug('Templates fetched successfully', { 
        count: result.templates?.length,
        pagination: result.pagination
      });
      
      return result;
    } catch (error) {
      procedureLogger.error('Failed to fetch procedure templates', { params, error });
      throw error;
    }
  }

  /**
   * Get all procedures for the current provider, optionally filtered by location
   */
  async getProviderProcedures(params?: {
    providerId?: string;
    locationId?: string;
    categoryId?: string;
    query?: string;
    page?: number;
    limit?: number;
  }): Promise<ProceduresResponse> {
    procedureLogger.debug('Fetching provider procedures', { params });
    
    try {
      let result: ProceduresResponse;
      
      // If providerId is provided, use the specific provider endpoint
      if (params?.providerId) {
        const { providerId, ...restParams } = params;
        procedureLogger.debug(`Using provider-specific endpoint for provider`, { providerId });
        
        result = await apiClient.get<ProceduresResponse>(`/providers/${providerId}/procedures`, { 
          params: restParams 
        });
      } else {
        // Otherwise use the general endpoint
        procedureLogger.debug('Using general provider procedures endpoint');
        result = await apiClient.get<ProceduresResponse>('/procedures/provider', { params });
      }
      
      procedureLogger.debug('Provider procedures fetched successfully', { 
        count: result.procedures?.length,
        pagination: result.pagination
      });
      
      return result;
    } catch (error) {
      procedureLogger.error('Failed to fetch provider procedures', { params, error });
      throw error;
    }
  }

  /**
   * Get details for a specific procedure
   */
  async getProcedureById(id: string): Promise<ProcedureResponse> {
    procedureLogger.debug('Fetching procedure by ID', { id });
    
    try {
      const result = await apiClient.get<ProcedureResponse>(`/procedures/${id}`);
      
      procedureLogger.debug('Procedure fetched successfully', { 
        id,
        templateName: result.procedure?.template?.name
      });
      
      return result;
    } catch (error) {
      procedureLogger.error('Failed to fetch procedure', { id, error });
      throw error;
    }
  }

  /**
   * Add a new procedure price for a location
   */
  async addPrice(data: CreateProcedureRequest): Promise<ProcedureResponse> {
    procedureLogger.info('Adding new procedure price', { 
      locationId: data.locationId,
      templateId: data.templateId,
      price: data.price
    });
    
    try {
      const result = await apiClient.post<ProcedureResponse>('/procedures/price', data);
      
      procedureLogger.info('Procedure price added successfully', {
        id: result.procedure?.id,
        price: result.procedure?.price
      });
      
      return result;
    } catch (error) {
      procedureLogger.error('Failed to add procedure price', { data, error });
      throw error;
    }
  }

  /**
   * Update the price of an existing procedure
   */
  async updatePrice(id: string, data: UpdateProcedureRequest): Promise<ProcedureResponse> {
    procedureLogger.info('Updating procedure price', { 
      id, 
      price: data.price 
    });
    
    try {
      const result = await apiClient.put<ProcedureResponse>(`/procedures/price/${id}`, data);
      
      procedureLogger.info('Procedure price updated successfully', {
        id,
        newPrice: data.price
      });
      
      return result;
    } catch (error) {
      procedureLogger.error('Failed to update procedure price', { id, price: data.price, error });
      throw error;
    }
  }

  /**
   * Delete a procedure price
   */
  async deletePrice(id: string): Promise<void> {
    procedureLogger.info('Deleting procedure price', { id });
    
    try {
      await apiClient.delete<void>(`/procedures/price/${id}`);
      procedureLogger.info('Procedure price deleted successfully', { id });
    } catch (error) {
      procedureLogger.error('Failed to delete procedure price', { id, error });
      throw error;
    }
  }

  /**
   * Bulk update procedure prices by percentage
   */
  async bulkUpdatePrices(data: BulkUpdatePriceRequest): Promise<{ updatedCount: number }> {
    procedureLogger.info('Bulk updating procedure prices', { 
      count: data.procedureIds.length,
      percentageChange: data.percentageChange 
    });
    
    try {
      const result = await apiClient.post<{ updatedCount: number }>('/procedures/price/bulk', data);
      
      procedureLogger.info('Procedure prices updated successfully', {
        updatedCount: result.updatedCount,
        percentageChange: data.percentageChange
      });
      
      return result;
    } catch (error) {
      procedureLogger.error('Failed to bulk update procedure prices', { 
        count: data.procedureIds.length,
        percentageChange: data.percentageChange,
        error 
      });
      throw error;
    }
  }

  /**
   * Get price statistics for a procedure template in a geographic area
   */
  async getPriceStats(templateId: string, params?: {
    locationId?: string;
    radius?: number;
  }): Promise<StatsResponse> {
    procedureLogger.debug('Fetching price statistics', { 
      templateId, 
      params 
    });
    
    try {
      const result = await apiClient.get<StatsResponse>(`/procedures/stats/${templateId}`, { params });
      
      procedureLogger.debug('Price statistics fetched successfully', { 
        templateId,
        min: result.stats?.min,
        max: result.stats?.max,
        average: result.stats?.average
      });
      
      return result;
    } catch (error) {
      procedureLogger.error('Failed to fetch price statistics', { templateId, params, error });
      throw error;
    }
  }

  /**
   * A different approach to the bulk update that uses a different endpoint
   * @deprecated Use bulkUpdatePrices instead
   */
  async updatePrices(data: BulkUpdatePriceRequest): Promise<{ updatedCount: number }> {
    procedureLogger.warn('Using deprecated updatePrices method', {
      count: data.procedureIds.length
    });
    return this.bulkUpdatePrices(data);
  }
}

// Create and export the singleton instance
export const procedureService = new ProcedureService();

// Export default for convenience
export default procedureService;
