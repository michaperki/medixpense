
// src/services/notificationService.ts
import apiClient from '@/lib/apiClient';

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
    return apiClient.get<NotificationsResponse>('/notifications', { params });
  }

  async markAsRead(id: string): Promise<void> {
    return apiClient.put<void>(`/notifications/${id}/read`);
  }

  async markAllAsRead(): Promise<void> {
    return apiClient.put<void>('/notifications/read-all');
  }

  async getSettings(): Promise<NotificationSettings> {
    return apiClient.get<NotificationSettings>('/notifications/settings');
  }

  async updateSettings(settings: NotificationSettings): Promise<NotificationSettings> {
    return apiClient.put<NotificationSettings>('/notifications/settings', settings);
  }
}

export const notificationService = new NotificationService();

