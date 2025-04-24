import apiClient from './apiClient';
import { getLogger } from '@/lib/logger';

// Import services
import { authService } from '@/services/authService';
import { locationService } from '@/services/locationService';
import { procedureService } from '@/services/procedureService';
import { notificationService } from '@/services/notificationService';
import { searchService } from '@/services/searchService';

// Create specific loggers for different API areas
const authLogger = getLogger('auth:api');
const locationLogger = getLogger('location:api');
const procedureLogger = getLogger('procedure:api');
const searchLogger = getLogger('search:api');
const notificationLogger = getLogger('notification:api');

// Auth API
export const authApi = {
  login: (email: string, password: string) => {
    authLogger.info('Login attempt', { email });
    return apiClient.post('/auth/login', { email, password });
  },
  
  register: (data: any) => {
    authLogger.info('Registration attempt', { 
      email: data.email, 
      role: data.role 
    });
    return apiClient.post('/auth/register', data);
  },
  
  me: () => {
    authLogger.debug('Fetching current user');
    return apiClient.get('/auth/me');
  },
  
  logout: (...args: any[]) => {
    authLogger.info('User logout');
    return authService?.logout(...args);
  },
  
  getCurrentUser: (...args: any[]) => {
    authLogger.debug('Getting current user from service');
    return authService?.getCurrentUser(...args);
  },
  
  updateProfile: (data: any, ...args: any[]) => {
    authLogger.info('Profile update');
    return authService?.updateProfile(data, ...args);
  },
  
  requestPasswordReset: (email: string, ...args: any[]) => {
    authLogger.info('Password reset requested', { email });
    return authService?.requestPasswordReset(email, ...args);
  },
  
  resetPassword: (token: string, ...args: any[]) => {
    authLogger.info('Password reset attempt');
    return authService?.resetPassword(token, ...args);
  },
  
  verifyEmail: (token: string, ...args: any[]) => {
    authLogger.info('Email verification attempt');
    return authService?.verifyEmail(token, ...args);
  },
};

// Locations API
export const locationsApi = {
  getAll: (page = 1, limit = 10) => {
    locationLogger.debug('Fetching all locations', { page, limit });
    return apiClient.get('/locations', { params: { page, limit } });
  },
  
  getById: (id: string) => {
    locationLogger.debug('Fetching location by ID', { id });
    return apiClient.get(`/locations/${id}`);
  },
  
  create: (data: any) => {
    locationLogger.info('Creating new location', { name: data.name });
    return apiClient.post('/locations', data);
  },
  
  update: (id: string, data: any) => {
    locationLogger.info('Updating location', { id, name: data.name });
    return apiClient.put(`/locations/${id}`, data);
  },
  
  delete: (id: string) => {
    locationLogger.info('Deleting location', { id });
    return apiClient.delete(`/locations/${id}`);
  },
};

// Procedures API - uses the class-based service
export const proceduresApi = {
  // Categories
  getCategories: () => {
    procedureLogger.debug('Fetching procedure categories');
    return procedureService.getCategories();
  },
  
  // Templates
  getTemplates: (params?: any) => {
    procedureLogger.debug('Fetching procedure templates', params);
    return procedureService.getTemplates(params);
  },
  
  // Procedures
  getProviderProcedures: (providerId?: string, params?: any) => {
    if (typeof providerId === 'string') {
      // Support for the original function signature where first parameter is providerId
      procedureLogger.debug('Fetching provider procedures', { providerId, ...params });
      return procedureService.getProviderProcedures({ providerId, ...params });
    } else {
      // Support for the new structure where all params are in a single object
      procedureLogger.debug('Fetching provider procedures with params object', providerId);
      return procedureService.getProviderProcedures(providerId);
    }
  },
  
  getProcedureById: (id: string) => {
    procedureLogger.debug('Fetching procedure by ID', { id });
    return procedureService.getProcedureById(id);
  },
  
  // Price management
  addPrice: (data: any) => {
    procedureLogger.info('Adding procedure price', { 
      templateId: data.templateId,
      locationId: data.locationId,
      price: data.price 
    });
    return procedureService.addPrice(data);
  },
  
  updatePrice: (id: string, data: any) => {
    procedureLogger.info('Updating procedure price', { 
      id, 
      price: data.price 
    });
    return procedureService.updatePrice(id, data);
  },
  
  deletePrice: (id: string) => {
    procedureLogger.info('Deleting procedure price', { id });
    return procedureService.deletePrice(id);
  },
  
  bulkUpdatePrices: (procedureIds: string[], percentageChange: number) => {
    procedureLogger.info('Bulk updating procedure prices', { 
      count: procedureIds.length,
      percentageChange 
    });
    return procedureService.bulkUpdatePrices({ procedureIds, percentageChange });
  },
  
  // Statistics
  getPriceStats: (templateId: string, params?: any) => {
    procedureLogger.debug('Fetching price statistics', { templateId, params });
    return procedureService.getPriceStats(templateId, params);
  },
};

// Search API
export const searchApi = {
  searchProcedures: (params: any) => {
    searchLogger.info('Searching procedures', { 
      query: params.query,
      location: params.location,
      radius: params.radius 
    });
    return apiClient.get('/search/procedures', { params });
  },
  
  getStats: (templateId: string, params?: any) => {
    searchLogger.debug('Fetching search stats', { templateId, params });
    return apiClient.get(`/search/stats/${templateId}`, { params });
  },
  
  searchProviders: (params: any) => {
    searchLogger.info('Searching providers', { 
      location: params.location, 
      specialties: params.specialties
    });
    return apiClient.get('/search/providers', { params });
  },
  
  getRecentSearches: (...args: any[]) => {
    searchLogger.debug('Fetching recent searches');
    return searchService?.getRecentSearches(...args);
  },
  
  saveSearch: (searchData: any, ...args: any[]) => {
    searchLogger.info('Saving search', { 
      query: searchData.query,
      type: searchData.type 
    });
    return searchService?.saveSearch(searchData, ...args);
  },
};

// Notifications API
export const notificationsApi = {
  getAll: (...args: any[]) => {
    notificationLogger.debug('Fetching all notifications');
    return notificationService?.getAll(...args);
  },
  
  getUnread: (...args: any[]) => {
    notificationLogger.debug('Fetching unread notifications');
    return notificationService?.getUnread(...args);
  },
  
  markAsRead: (id: string, ...args: any[]) => {
    notificationLogger.debug('Marking notification as read', { id });
    return notificationService?.markAsRead(id, ...args);
  },
  
  markAllAsRead: (...args: any[]) => {
    notificationLogger.info('Marking all notifications as read');
    return notificationService?.markAllAsRead(...args);
  },
  
  delete: (id: string, ...args: any[]) => {
    notificationLogger.info('Deleting notification', { id });
    return notificationService?.delete(id, ...args);
  },
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
