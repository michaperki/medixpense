import apiClient from './apiClient';

// Import services
import { authService } from '@/services/authService';
import { locationService } from '@/services/locationService';
import { procedureService } from '@/services/procedureService';
import { notificationService } from '@/services/notificationService';
import { searchService } from '@/services/searchService';

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  register: (data: any) =>
    apiClient.post('/auth/register', data),
  me: () =>
    apiClient.get('/auth/me'),
  logout: authService?.logout,
  getCurrentUser: authService?.getCurrentUser,
  updateProfile: authService?.updateProfile,
  requestPasswordReset: authService?.requestPasswordReset,
  resetPassword: authService?.resetPassword,
  verifyEmail: authService?.verifyEmail,
};

// Locations API
export const locationsApi = {
  getAll: (page = 1, limit = 10) =>
    apiClient.get('/locations', { params: { page, limit } }),
  getById: (id: string) =>
    apiClient.get(`/locations/${id}`),
  create: (data: any) =>
    apiClient.post('/locations', data),
  update: (id: string, data: any) =>
    apiClient.put(`/locations/${id}`, data),
  delete: (id: string) =>
    apiClient.delete(`/locations/${id}`),
};

// Procedures API - uses the class-based service
export const proceduresApi = {
  // Categories
  getCategories: () => procedureService.getCategories(),
  
  // Templates
  getTemplates: (params?: any) => procedureService.getTemplates(params),
  
  // Procedures
  getProviderProcedures: (providerId?: string, params?: any) => {
    if (typeof providerId === 'string') {
      // Support for the original function signature where first parameter is providerId
      return procedureService.getProviderProcedures({ providerId, ...params });
    } else {
      // Support for the new structure where all params are in a single object
      return procedureService.getProviderProcedures(providerId);
    }
  },
  getProcedureById: (id: string) => procedureService.getProcedureById(id),
  
  // Price management
  addPrice: (data: any) => procedureService.addPrice(data),
  updatePrice: (id: string, data: any) => procedureService.updatePrice(id, data),
  deletePrice: (id: string) => procedureService.deletePrice(id),
  bulkUpdatePrices: (procedureIds: string[], percentageChange: number) => 
    procedureService.bulkUpdatePrices({ procedureIds, percentageChange }),
  
  // Statistics
  getPriceStats: (templateId: string, params?: any) => 
    procedureService.getPriceStats(templateId, params),
};

// Search API
export const searchApi = {
  searchProcedures: (params: any) =>
    apiClient.get('/search/procedures', { params }),
  getStats: (templateId: string, params?: any) =>
    apiClient.get(`/search/stats/${templateId}`, { params }),
  searchProviders: (params: any) =>
    apiClient.get('/search/providers', { params }),
  getRecentSearches: searchService?.getRecentSearches,
  saveSearch: searchService?.saveSearch,
};

// Notifications API
export const notificationsApi = {
  getAll: notificationService?.getAll,
  getUnread: notificationService?.getUnread,
  markAsRead: notificationService?.markAsRead,
  markAllAsRead: notificationService?.markAllAsRead,
  delete: notificationService?.delete,
};

// Export consolidated API
export const api = {
  auth: authApi,
  locations: locationsApi,
  procedures: proceduresApi,
  search: searchApi,
  notifications: notificationsApi,
};

export default api;
