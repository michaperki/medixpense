
import apiClient from '@/lib/apiClient';
import { handleApiError } from '@/lib/api/handleApiError';

// Types
export interface ProviderProfile {
  id: string;
  userId: string;
  organizationName: string;
  bio?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  logoUrl?: string;
  stripeCustomerId?: string;
  subscriptionStatus?: string;
  subscriptionTier?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  organizationName?: string;
  bio?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

// Profile Service Class
export class ProfileService {
  async getProviderProfile(): Promise<ProviderProfile> {
    return apiClient.get<ProviderProfile>('/profile/provider')
      .catch((error) => handleApiError(error, 'getProviderProfile'));
  }

  async updateProviderProfile(data: UpdateProfileRequest): Promise<ProviderProfile> {
    return apiClient.put<ProviderProfile>('/profile/provider', data)
      .catch((error) => handleApiError(error, 'updateProviderProfile'));
  }

  async uploadLogo(file: File): Promise<{ logoUrl: string }> {
    const formData = new FormData();
    formData.append('logo', file);
    
    return apiClient.uploadFile<{ logoUrl: string }>('/profile/provider/logo', formData)
      .catch((error) => handleApiError(error, 'uploadLogo'));
  }

  async getPublicProfile(providerId: string): Promise<ProviderProfile> {
    return apiClient.get<ProviderProfile>(`/profile/provider/${providerId}/public`)
      .catch((error) => handleApiError(error, 'getPublicProfile'));
  }
}

export const profileService = new ProfileService();

// API Functions for direct use
export const profileApi = {
  getProviderProfile: () => profileService.getProviderProfile(),
  updateProviderProfile: (data: UpdateProfileRequest) => profileService.updateProviderProfile(data),
  uploadLogo: (file: File) => profileService.uploadLogo(file),
  getPublicProfile: (providerId: string) => profileService.getPublicProfile(providerId),
};

export default profileApi;

