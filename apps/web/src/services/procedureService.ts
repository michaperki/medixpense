import apiClient from '@/lib/apiClient';

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
    return apiClient.get<CategoriesResponse>('/procedures/categories');
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
    return apiClient.get<TemplatesResponse>('/procedures/templates', { params });
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
    // If providerId is provided, use the specific provider endpoint
    if (params?.providerId) {
      const { providerId, ...restParams } = params;
      return apiClient.get<ProceduresResponse>(`/providers/${providerId}/procedures`, { 
        params: restParams 
      });
    }
    
    // Otherwise use the general endpoint
    return apiClient.get<ProceduresResponse>('/procedures/provider', { params });
  }

  /**
   * Get details for a specific procedure
   */
  async getProcedureById(id: string): Promise<ProcedureResponse> {
    return apiClient.get<ProcedureResponse>(`/procedures/${id}`);
  }

  /**
   * Add a new procedure price for a location
   */
  async addPrice(data: CreateProcedureRequest): Promise<ProcedureResponse> {
    return apiClient.post<ProcedureResponse>('/procedures/price', data);
  }

  /**
   * Update the price of an existing procedure
   */
  async updatePrice(id: string, data: UpdateProcedureRequest): Promise<ProcedureResponse> {
    return apiClient.put<ProcedureResponse>(`/procedures/price/${id}`, data);
  }

  /**
   * Delete a procedure price
   */
  async deletePrice(id: string): Promise<void> {
    return apiClient.delete<void>(`/procedures/price/${id}`);
  }

  /**
   * Bulk update procedure prices by percentage
   */
  async bulkUpdatePrices(data: BulkUpdatePriceRequest): Promise<{ updatedCount: number }> {
    return apiClient.post<{ updatedCount: number }>('/procedures/price/bulk', data);
  }

  /**
   * Get price statistics for a procedure template in a geographic area
   */
  async getPriceStats(templateId: string, params?: {
    locationId?: string;
    radius?: number;
  }): Promise<StatsResponse> {
    return apiClient.get<StatsResponse>(`/procedures/stats/${templateId}`, { params });
  }

  /**
   * A different approach to the bulk update that uses a different endpoint
   * @deprecated Use bulkUpdatePrices instead
   */
  async updatePrices(data: BulkUpdatePriceRequest): Promise<{ updatedCount: number }> {
    return this.bulkUpdatePrices(data);
  }
}

// Create and export the singleton instance
export const procedureService = new ProcedureService();

// Export default for convenience
export default procedureService;
