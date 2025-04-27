import apiClient from '@/lib/apiClient';
import { getLogger } from '@/lib/logger';
import { handleApiError } from '@/lib/api/handleApiError';

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

export interface Provider {
  id: string;
  name: string;
  phone?: string;
  website?: string;
  description?: string;
  rating?: number;
  reviewCount?: number;
}

export interface Location {
  id: string;
  name?: string;
  address1?: string;
  address2?: string;
  city: string;
  state: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
}

export interface Procedure {
  id: string;
  price: number;
  location: Location & {
    provider?: Provider;
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

// New detailed procedure type for the procedure detail page
export interface ProcedureDetail {
  id: string;
  name: string;
  description?: string;
  duration?: string;
  preparation?: string;
  aftercare?: string;
  category: {
    id: string;
    name: string;
  };
  providers: Array<{
    id: string;
    price: number;
    savingsPercent?: number;
    provider: Provider & {
      location: Location;
    };
  }>;
  averagePrice?: number;
  lowestPrice?: number;
  highestPrice?: number;
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

// New response type for the detailed procedure
export interface ProcedureDetailResponse {
  procedure: ProcedureDetail;
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
  async getCategories(): Promise<CategoriesResponse> {
    procedureLogger.debug('Fetching procedure categories');
    return apiClient.get<CategoriesResponse>('/procedures/categories')
      .catch((error) => handleApiError(error, 'getCategories'));
  }

  async getTemplates(params?: { query?: string; categoryId?: string; page?: number; limit?: number; }): Promise<TemplatesResponse> {
    procedureLogger.debug('Fetching procedure templates', { params });
    return apiClient.get<TemplatesResponse>('/procedures/templates', { params })
      .catch((error) => handleApiError(error, 'getTemplates'));
  }

  async getProviderProcedures(providerId: string, params?: {
    page?: number;
    limit?: number;
    categoryId?: string;
    query?: string;
  }): Promise<ProceduresResponse> {
    procedureLogger.debug('Fetching provider procedures', { providerId, params });
    return apiClient
      .get<ProceduresResponse>(`/providers/${providerId}/procedures`, { params })
      .catch((error) => handleApiError(error, 'getProviderProcedures'));
  }

  // Updated to use the new detailed response type
  async getProcedureById(id: string): Promise<ProcedureDetailResponse> {
    procedureLogger.debug('Fetching procedure by ID', { id });
    return apiClient.get<ProcedureDetailResponse>(`/procedures/${id}`)
      .catch((error) => {
        procedureLogger.error('Error fetching procedure', { id, error });
        return handleApiError(error, 'getProcedureById');
      });
  }

  async addPrice(data: CreateProcedureRequest): Promise<ProcedureResponse> {
    procedureLogger.info('Adding new procedure price', { data });
    return apiClient.post<ProcedureResponse>('/procedures/price', data)
      .catch((error) => handleApiError(error, 'addPrice'));
  }

  async updatePrice(id: string, data: UpdateProcedureRequest): Promise<ProcedureResponse> {
    procedureLogger.info('Updating procedure price', { id, data });
    return apiClient.put<ProcedureResponse>(`/procedures/price/${id}`, data)
      .catch((error) => handleApiError(error, 'updatePrice'));
  }

  async deletePrice(id: string): Promise<void> {
    procedureLogger.info('Deleting procedure price', { id });
    return apiClient.delete<void>(`/procedures/price/${id}`)
      .catch((error) => handleApiError(error, 'deletePrice'));
  }

  async bulkUpdatePrices(data: BulkUpdatePriceRequest): Promise<{ updatedCount: number }> {
    procedureLogger.info('Bulk updating procedure prices', { data });
    return apiClient.post<{ updatedCount: number }>('/procedures/price/bulk', data)
      .catch((error) => handleApiError(error, 'bulkUpdatePrices'));
  }

  async getPriceStats(templateId: string, params?: { locationId?: string; radius?: number }): Promise<StatsResponse> {
    procedureLogger.debug('Fetching price statistics', { templateId, params });
    return apiClient.get<StatsResponse>(`/procedures/stats/${templateId}`, { params })
      .catch((error) => handleApiError(error, 'getPriceStats'));
  }

  /** @deprecated Use bulkUpdatePrices instead */
  async updatePrices(data: BulkUpdatePriceRequest): Promise<{ updatedCount: number }> {
    procedureLogger.warn('Using deprecated updatePrices method', { data });
    return this.bulkUpdatePrices(data);
  }
}

export const procedureService = new ProcedureService();
export default procedureService;
