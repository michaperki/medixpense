
import apiClient from '@/lib/apiClient';
import { handleApiError } from '@/lib/api/handleApiError';

// Types
export interface GeneralSettings {
  language: string;
  timeZone: string;
  dateFormat: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
}

export interface BillingSettings {
  subscriptionPlan: string;
  autoRenew: boolean;
}

export interface ProviderSettings {
  general: GeneralSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
  billing: BillingSettings;
}

export interface UpdateSettingsRequest {
  settingsType: 'general' | 'notifications' | 'security' | 'billing';
  [key: string]: any;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Settings Service Class
export class SettingsService {
  async getProviderSettings(): Promise<ProviderSettings> {
    return apiClient.get<ProviderSettings>('/settings/provider')
      .catch((error) => handleApiError(error, 'getProviderSettings'));
  }

  async updateProviderSettings(data: UpdateSettingsRequest): Promise<ProviderSettings> {
    return apiClient.put<ProviderSettings>('/settings/provider', data)
      .catch((error) => handleApiError(error, 'updateProviderSettings'));
  }

  async changePassword(data: ChangePasswordRequest): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>('/settings/change-password', data)
      .catch((error) => handleApiError(error, 'changePassword'));
  }

  async enableTwoFactor(): Promise<{ setupCode: string }> {
    return apiClient.post<{ setupCode: string }>('/settings/two-factor/enable')
      .catch((error) => handleApiError(error, 'enableTwoFactor'));
  }

  async verifyTwoFactor(code: string): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>('/settings/two-factor/verify', { code })
      .catch((error) => handleApiError(error, 'verifyTwoFactor'));
  }

  async disableTwoFactor(): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>('/settings/two-factor/disable')
      .catch((error) => handleApiError(error, 'disableTwoFactor'));
  }
}

export const settingsService = new SettingsService();

// API Functions for direct use
export const settingsApi = {
  getProviderSettings: () => settingsService.getProviderSettings(),
  updateProviderSettings: (data: UpdateSettingsRequest) => settingsService.updateProviderSettings(data),
  changePassword: (data: ChangePasswordRequest) => settingsService.changePassword(data),
  enableTwoFactor: () => settingsService.enableTwoFactor(),
  verifyTwoFactor: (code: string) => settingsService.verifyTwoFactor(code),
  disableTwoFactor: () => settingsService.disableTwoFactor(),
};

export default settingsApi;

