
import apiClient from '@/lib/apiClient';
import { handleApiError } from '@/lib/api/handleApiError';

// Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
  providerName?: string;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  profileImageUrl?: string;
  role: 'ADMIN' | 'PROVIDER' | 'USER';
  provider?: {
    id: string;
    name: string;
    description?: string;
    website?: string;
    phone?: string;
    subscriptionStatus: string;
  } | null;
  unreadNotifications?: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  passwordConfirmation: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  provider?: {
    name?: string;
    description?: string;
    website?: string;
    phone?: string;
  };
}

// Auth Service
export class AuthService {
  async login(data: LoginRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/login', data)
      .catch((error) => handleApiError(error, 'login'));
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/register', data)
      .catch((error) => handleApiError(error, 'register'));
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    return apiClient.post<void>('/auth/forgot-password', data)
      .catch((error) => handleApiError(error, 'forgotPassword'));
  }

  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    return apiClient.post<void>('/auth/reset-password', data)
      .catch((error) => handleApiError(error, 'resetPassword'));
  }

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    return apiClient.post<void>('/auth/change-password', data)
      .catch((error) => handleApiError(error, 'changePassword'));
  }

  async getProfile(): Promise<User> {
    return apiClient.get<User>('/auth/me')
      .catch((error) => handleApiError(error, 'getProfile'));
  }

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    return apiClient.put<User>('/auth/profile', data)
      .catch((error) => handleApiError(error, 'updateProfile'));
  }

  async uploadProfileImage(file: File): Promise<{ profileImageUrl: string }> {
    const formData = new FormData();
    formData.append('image', file);

    return apiClient.uploadFile<{ profileImageUrl: string }>('/auth/profile/image', formData)
      .catch((error) => handleApiError(error, 'uploadProfileImage'));
  }

  async validateResetToken(token: string): Promise<{ valid: boolean }> {
    return apiClient.get<{ valid: boolean }>(`/auth/reset-password/${token}/validate`)
      .catch((error) => handleApiError(error, 'validateResetToken'));
  }

  async enableTwoFactor(): Promise<{ setupCode: string }> {
    return apiClient.post<{ setupCode: string }>('/auth/two-factor/enable')
      .catch((error) => handleApiError(error, 'enableTwoFactor'));
  }

  async verifyTwoFactor(code: string): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>('/auth/two-factor/verify', { code })
      .catch((error) => handleApiError(error, 'verifyTwoFactor'));
  }

  async disableTwoFactor(): Promise<void> {
    return apiClient.post<void>('/auth/two-factor/disable')
      .catch((error) => handleApiError(error, 'disableTwoFactor'));
  }
}

export const authService = new AuthService();

