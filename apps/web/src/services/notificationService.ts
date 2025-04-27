
import apiClient from '@/lib/apiClient';
import { handleApiError } from '@/lib/api/handleApiError';

// Types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface NotificationSetting {
  id: string;
  type: string;
  description: string;
  email: boolean;
  push: boolean;
  sms: boolean;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  settings: NotificationSetting[];
}

// Notification Service
export class NotificationService {
  async getAll(params?: { page?: number; limit?: number }): Promise<NotificationsResponse> {
    return apiClient.get<NotificationsResponse>('/notifications', { params })
      .catch((error) => handleApiError(error, 'getAllNotifications'));
  }

  async markAsRead(id: string): Promise<void> {
    return apiClient.put<void>(`/notifications/${id}/read`)
      .catch((error) => handleApiError(error, 'markAsRead'));
  }

  async markAllAsRead(): Promise<void> {
    return apiClient.put<void>('/notifications/read-all')
      .catch((error) => handleApiError(error, 'markAllAsRead'));
  }

  async getSettings(): Promise<NotificationSettings> {
    return apiClient.get<NotificationSettings>('/notifications/settings')
      .catch((error) => handleApiError(error, 'getSettings'));
  }

  async updateSettings(settings: NotificationSettings): Promise<NotificationSettings> {
    return apiClient.put<NotificationSettings>('/notifications/settings', settings)
      .catch((error) => handleApiError(error, 'updateSettings'));
  }
}

export const notificationService = new NotificationService();

