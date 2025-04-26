import apiClient from './apiClient';
import { getLogger } from '@/lib/logger';

import { authService } from '@/services/authService';
import locationService from '@/services/locationService';
import { procedureService } from '@/services/procedureService';
import { notificationService } from '@/services/notificationService';
import { searchService } from '@/services/searchService';

// ─── Loggers ────────────────────────────────────────────────────
const authLogger         = getLogger('auth');
const locationLogger     = getLogger('location');
const procedureLogger    = getLogger('procedure');
const searchLogger       = getLogger('search');
const notificationLogger = getLogger('notification');

// ─── AUTH ────────────────────────────────────────────────────────
export const authApi = {
  login: async (email: string, password: string) => {
    authLogger.with({ email }).info('Attempt login');
    return apiClient.post('/auth/login', { email, password });
  },
  register: async (data: any) => {
    authLogger.with({ email: data.email }).info('Attempt register');
    return apiClient.post('/auth/register', data);
  },
  me: async () => {
    authLogger.info('Fetch current user');
    return apiClient.get('/auth/me');
  },
  logout: (...args: any[]) => {
    authLogger.info('Logout');
    return authService?.logout(...args);
  },
  getCurrentUser: (...args: any[]) => {
    authLogger.debug('Get cached user');
    return authService?.getCurrentUser(...args);
  },
  updateProfile: async (data: any, ...args: any[]) => {
    authLogger.info('Profile update');
    return authService?.updateProfile(data, ...args);
  },
  requestPasswordReset: async (email: string, ...args: any[]) => {
    authLogger.with({ email }).info('Password reset request');
    return authService?.requestPasswordReset(email, ...args);
  },
  resetPassword: async (token: string, ...args: any[]) => {
    authLogger.with({ token }).info('Password reset');
    return authService?.resetPassword(token, ...args);
  },
  verifyEmail: async (token: string, ...args: any[]) => {
    authLogger.with({ token }).info('Verify email');
    return authService?.verifyEmail(token, ...args);
  },
};

// ─── LOCATIONS ───────────────────────────────────────────────────
export const locationsApi = {
  getAll: async (page = 1, limit = 10) => {
    locationLogger.with({ page, limit }).debug('Get all');
    return apiClient.get('/locations', { params: { page, limit } });
  },
  getById: async (id: string) => {
    locationLogger.with({ id }).debug('Get by ID');
    return locationService.getById(id);
  },
  create: async (data: any) => {
    locationLogger.with({ name: data.name }).info('Create');
    return apiClient.post('/locations', data);
  },
  update: async (id: string, data: any) => {
    locationLogger.with({ id }).info('Update');
    return apiClient.put(`/locations/${id}`, data);
  },
  delete: async (id: string) => {
    locationLogger.with({ id }).info('Delete');
    return apiClient.delete(`/locations/${id}`);
  },
};

// ─── PROCEDURES ──────────────────────────────────────────────────
export const proceduresApi = {
  getCategories: async () => {
    procedureLogger.debug('Get categories');
    return procedureService.getCategories();
  },
  getTemplates: async (params?: any) => {
    procedureLogger.debug('Get templates', params);
    return procedureService.getTemplates(params);
  },
  getProviderProcedures: async (providerId?: string, params?: any) => {
    procedureLogger.with({ providerId }).debug('Get provider procedures');
    return procedureService.getProviderProcedures({ providerId, ...params });
  },
  getProcedureById: async (id: string) => {
    procedureLogger.with({ id }).debug('Get procedure by ID');
    return procedureService.getProcedureById(id);
  },
  getProceduresByLocation: async (locationId: string) => {
    procedureLogger.with({ locationId }).debug('Get procedures by location');
    const res = await apiClient.get(`/locations/${locationId}/procedures`);
    return res.procedures;
  },
  addPrice: async (data: any) => {
    procedureLogger.with({ templateId: data.templateId }).info('Add price');
    return procedureService.addPrice(data);
  },
  updatePrice: async (id: string, data: any) => {
    procedureLogger.with({ id }).info('Update price');
    return procedureService.updatePrice(id, data);
  },
  deletePrice: async (id: string) => {
    procedureLogger.with({ id }).info('Delete price');
    return procedureService.deletePrice(id);
  },
  bulkUpdatePrices: async (procedureIds: string[], percentageChange: number) => {
    procedureLogger.with({ count: procedureIds.length }).info('Bulk price update');
    return procedureService.bulkUpdatePrices({ procedureIds, percentageChange });
  },
  getPriceStats: async (templateId: string, params?: any) => {
    procedureLogger.with({ templateId }).debug('Get price stats');
    return procedureService.getPriceStats(templateId, params);
  },
};

// ─── SEARCH ──────────────────────────────────────────────────────
export const searchApi = {
  searchProcedures: async (params: any): Promise<SearchResponse> => {
    return apiClient.get<SearchResponse>('/search/procedures', { params });
  },
  getStats: async (templateId: string, params?: any) => {
    searchLogger.with({ templateId }).debug('Get stats');
    return apiClient.get(`/search/stats/${templateId}`, { params });
  },
  searchProviders: async (params: any) => {
    searchLogger.with(params).info('Search providers');
    return apiClient.get('/search/providers', { params });
  },
  getRecentSearches: (...args: any[]) => {
    searchLogger.debug('Get recent searches');
    return searchService?.getRecentSearches(...args);
  },
  saveSearch: (searchData: any, ...args: any[]) => {
    searchLogger.with(searchData).info('Save search');
    return searchService?.saveSearch(searchData, ...args);
  },
};

// ─── NOTIFICATIONS ───────────────────────────────────────────────
export const notificationsApi = {
  getAll: async (...args: any[]) => {
    notificationLogger.debug('Get all notifications');
    return notificationService?.getAll(...args);
  },
  getUnread: async (...args: any[]) => {
    notificationLogger.debug('Get unread notifications');
    return notificationService?.getUnread(...args);
  },
  markAsRead: async (id: string, ...args: any[]) => {
    notificationLogger.with({ id }).info('Mark as read');
    return notificationService?.markAsRead(id, ...args);
  },
  markAllAsRead: async (...args: any[]) => {
    notificationLogger.info('Mark all as read');
    return notificationService?.markAllAsRead(...args);
  },
  delete: async (id: string, ...args: any[]) => {
    notificationLogger.with({ id }).info('Delete notification');
    return notificationService?.delete(id, ...args);
  },
};

// ─── API EXPORT ──────────────────────────────────────────────────
export const api = {
  client: apiClient, // 👈 expose the singleton client here
  auth: authApi,
  locations: locationsApi,
  procedures: proceduresApi,
  search: searchApi,
  notifications: notificationsApi,
};

export default api;
