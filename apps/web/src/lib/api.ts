
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
  login: (email: string, password: string) => {
    authLogger.with({ email }).info('Attempt login');
    return apiClient.post('/auth/login', { email, password });
  },
  register: (data: any) => {
    authLogger.with({ email: data.email }).info('Attempt register');
    return apiClient.post('/auth/register', data);
  },
  me: () => {
    authLogger.info('Fetch current user');
    return apiClient.get('/auth/me');
  },
  logout: () => {
    authLogger.info('Logout');
    return authService?.logout();
  },
  getCurrentUser: () => {
    authLogger.debug('Get cached user');
    return authService?.getCurrentUser();
  },
  updateProfile: (data: any) => {
    authLogger.info('Profile update');
    return authService?.updateProfile(data);
  },
  requestPasswordReset: (email: string) => {
    authLogger.with({ email }).info('Password reset request');
    return authService?.requestPasswordReset(email);
  },
  resetPassword: (token: string) => {
    authLogger.with({ token }).info('Password reset');
    return authService?.resetPassword(token);
  },
  verifyEmail: (token: string) => {
    authLogger.with({ token }).info('Verify email');
    return authService?.verifyEmail(token);
  },
};

// ─── LOCATIONS ───────────────────────────────────────────────────
export const locationsApi = {
  getAll: (page = 1, limit = 10) => {
    locationLogger.with({ page, limit }).debug('Get all');
    return apiClient.get('/locations', { params: { page, limit } });
  },
  getById: (id: string) => {
    locationLogger.with({ id }).debug('Get by ID');
    return locationService.getById(id);
  },
  create: (data: any) => {
    locationLogger.with({ name: data.name }).info('Create');
    return apiClient.post('/locations', data);
  },
  update: (id: string, data: any) => {
    locationLogger.with({ id }).info('Update');
    return apiClient.put(`/locations/${id}`, data);
  },
  delete: (id: string) => {
    locationLogger.with({ id }).info('Delete');
    return apiClient.delete(`/locations/${id}`);
  },
};

// ─── PROCEDURES ──────────────────────────────────────────────────
export const proceduresApi = {
  getCategories: () => {
    procedureLogger.debug('Get categories');
    return procedureService.getCategories();
  },
  getTemplates: (params?: any) => {
    procedureLogger.debug('Get templates', params);
    return procedureService.getTemplates(params);
  },
  getProviderProcedures: (providerId?: string, params?: any) => {
    procedureLogger.with({ providerId }).debug('Get provider procedures');
    return procedureService.getProviderProcedures({ providerId, ...params });
  },
  getProcedureById: (id: string) => {
    procedureLogger.with({ id }).debug('Get procedure by ID');
    return procedureService.getProcedureById(id);
  },
  getProceduresByLocation: (locationId: string) => {
    procedureLogger.with({ locationId }).debug('Get procedures by location');
    return apiClient.get(`/locations/${locationId}/procedures`);
  },
  addPrice: (data: any) => {
    procedureLogger.with({ templateId: data.templateId }).info('Add price');
    return procedureService.addPrice(data);
  },
  updatePrice: (id: string, data: any) => {
    procedureLogger.with({ id }).info('Update price');
    return procedureService.updatePrice(id, data);
  },
  deletePrice: (id: string) => {
    procedureLogger.with({ id }).info('Delete price');
    return procedureService.deletePrice(id);
  },
  bulkUpdatePrices: (procedureIds: string[], percentageChange: number) => {
    procedureLogger.with({ count: procedureIds.length }).info('Bulk price update');
    return procedureService.bulkUpdatePrices({ procedureIds, percentageChange });
  },
  getPriceStats: (templateId: string, params?: any) => {
    procedureLogger.with({ templateId }).debug('Get price stats');
    return procedureService.getPriceStats(templateId, params);
  },
};

// ─── SEARCH ──────────────────────────────────────────────────────
export const searchApi = {
  searchProcedures: (params: any) => {
    return apiClient.get<SearchResponse>('/search/procedures', { params });
  },
  getStats: (templateId: string, params?: any) => {
    searchLogger.with({ templateId }).debug('Get stats');
    return apiClient.get(`/search/stats/${templateId}`, { params });
  },
  searchProviders: (params: any) => {
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
  getAll: (...args: any[]) => {
    notificationLogger.debug('Get all notifications');
    return notificationService?.getAll(...args);
  },
  getUnread: (...args: any[]) => {
    notificationLogger.debug('Get unread notifications');
    return notificationService?.getUnread(...args);
  },
  markAsRead: (id: string, ...args: any[]) => {
    notificationLogger.with({ id }).info('Mark as read');
    return notificationService?.markAsRead(id, ...args);
  },
  markAllAsRead: (...args: any[]) => {
    notificationLogger.info('Mark all as read');
    return notificationService?.markAllAsRead(...args);
  },
  delete: (id: string, ...args: any[]) => {
    notificationLogger.with({ id }).info('Delete notification');
    return notificationService?.delete(id, ...args);
  },
};

// ─── API EXPORT ──────────────────────────────────────────────────
export const api = {
  client: apiClient,
  auth: authApi,
  locations: locationsApi,
  procedures: proceduresApi,
  search: searchApi,
  notifications: notificationsApi,
};

export default api;

