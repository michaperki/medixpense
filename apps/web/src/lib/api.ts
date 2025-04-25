// src/lib/api.ts

import apiClient from './apiClient';
import { getLogger } from '@/lib/logger';

import { authService } from '@/services/authService';
import locationService from '@/services/locationService';
import { procedureService } from '@/services/procedureService';
import { notificationService } from '@/services/notificationService';
import { searchService } from '@/services/searchService';

const authLogger = getLogger('API:auth');
const locationLogger = getLogger('API:location');
const procedureLogger = getLogger('API:procedure');
const searchLogger = getLogger('API:search');
const notificationLogger = getLogger('API:notification');

export const authApi = {
  login: (email: string, password: string) =>
    authLogger.with({ email }).info('Attempt login') ||
    apiClient.post('/auth/login', { email, password }),

  register: (data: any) =>
    authLogger.with({ email: data.email }).info('Attempt register') ||
    apiClient.post('/auth/register', data),

  me: () => authLogger.info('Fetch current user') || apiClient.get('/auth/me'),

  logout: (...args: any[]) => authLogger.info('Logout') || authService?.logout(...args),

  getCurrentUser: (...args: any[]) => authLogger.debug('Get cached user') || authService?.getCurrentUser(...args),

  updateProfile: (data: any, ...args: any[]) =>
    authLogger.info('Profile update') || authService?.updateProfile(data, ...args),

  requestPasswordReset: (email: string, ...args: any[]) =>
    authLogger.with({ email }).info('Password reset request') || authService?.requestPasswordReset(email, ...args),

  resetPassword: (token: string, ...args: any[]) =>
    authLogger.with({ token }).info('Password reset') || authService?.resetPassword(token, ...args),

  verifyEmail: (token: string, ...args: any[]) =>
    authLogger.with({ token }).info('Verify email') || authService?.verifyEmail(token, ...args),
};

export const locationsApi = {
  getAll: (page = 1, limit = 10) =>
    locationLogger.with({ page, limit }).debug('Get all') ||
    apiClient.get('/locations', { params: { page, limit } }),

  getById: (id: string) =>
    locationLogger.with({ id }).debug('Get by ID') ||
    locationService.getById(id),

  create: (data: any) =>
    locationLogger.with({ name: data.name }).info('Create') ||
    apiClient.post('/locations', data),

  update: (id: string, data: any) =>
    locationLogger.with({ id }).info('Update') ||
    apiClient.put(`/locations/${id}`, data),

  delete: (id: string) =>
    locationLogger.with({ id }).info('Delete') ||
    apiClient.delete(`/locations/${id}`),
};

export const proceduresApi = {
  getCategories: () => procedureLogger.debug('Get categories') || procedureService.getCategories(),

  getTemplates: (params?: any) =>
    procedureLogger.debug('Get templates', params) || procedureService.getTemplates(params),

  getProviderProcedures: (providerId?: string, params?: any) =>
    procedureLogger.with({ providerId }).debug('Get procedures') ||
    procedureService.getProviderProcedures({ providerId, ...params }),

  getProcedureById: (id: string) =>
    procedureLogger.with({ id }).debug('Get by ID') ||
    procedureService.getProcedureById(id),

  addPrice: (data: any) =>
    procedureLogger.with({ templateId: data.templateId }).info('Add price') ||
    procedureService.addPrice(data),

  updatePrice: (id: string, data: any) =>
    procedureLogger.with({ id }).info('Update price') ||
    procedureService.updatePrice(id, data),

  deletePrice: (id: string) =>
    procedureLogger.with({ id }).info('Delete price') ||
    procedureService.deletePrice(id),

  bulkUpdatePrices: (procedureIds: string[], percentageChange: number) =>
    procedureLogger.with({ count: procedureIds.length }).info('Bulk price update') ||
    procedureService.bulkUpdatePrices({ procedureIds, percentageChange }),

  getPriceStats: (templateId: string, params?: any) =>
    procedureLogger.with({ templateId }).debug('Get price stats') ||
    procedureService.getPriceStats(templateId, params),
};

export const searchApi = {
  searchProcedures: (params: any) =>
    searchLogger.with(params).info('Search procedures') ||
    apiClient.get('/search/procedures', { params }),

  getStats: (templateId: string, params?: any) =>
    searchLogger.with({ templateId }).debug('Get search stats') ||
    apiClient.get(`/search/stats/${templateId}`, { params }),

  searchProviders: (params: any) =>
    searchLogger.with(params).info('Search providers') ||
    apiClient.get('/search/providers', { params }),

  getRecentSearches: (...args: any[]) =>
    searchLogger.debug('Get recent searches') || searchService?.getRecentSearches(...args),

  saveSearch: (searchData: any, ...args: any[]) =>
    searchLogger.with(searchData).info('Save search') || searchService?.saveSearch(searchData, ...args),
};

export const notificationsApi = {
  getAll: (...args: any[]) => notificationLogger.debug('Get all') || notificationService?.getAll(...args),

  getUnread: (...args: any[]) => notificationLogger.debug('Get unread') || notificationService?.getUnread(...args),

  markAsRead: (id: string, ...args: any[]) =>
    notificationLogger.with({ id }).info('Mark as read') || notificationService?.markAsRead(id, ...args),

  markAllAsRead: (...args: any[]) =>
    notificationLogger.info('Mark all as read') || notificationService?.markAllAsRead(...args),

  delete: (id: string, ...args: any[]) =>
    notificationLogger.with({ id }).info('Delete') || notificationService?.delete(id, ...args),
};

export const api = {
  auth: authApi,
  locations: locationsApi,
  procedures: proceduresApi,
  search: searchApi,
  notifications: notificationsApi,
};

export default api;
