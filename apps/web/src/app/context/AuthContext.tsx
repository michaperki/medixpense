"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import apiClient, { ApiError } from "@/lib/apiClient";
import axios from "axios";
import { authLogger } from "@/lib/logger";
import type {
  User,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  AuthResponse
} from "@/services";

// Add a type for provider
type Provider = {
  id: string;
  userId: string;
  organizationName: string;
  phone?: string;
  website?: string;
  bio?: string;
  logoUrl?: string;
  stripeCustomerId?: string;
  subscriptionStatus?: string;
  subscriptionTier?: string;
  createdAt: string;
  updatedAt: string;
};

// Extend User type to include provider property
type UserWithProvider = User & {
  provider?: Provider;
};

type AuthContextType = {
  user: UserWithProvider | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<UserWithProvider>;
  logout: () => void;
  register: (data: RegisterRequest) => Promise<UserWithProvider>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<UserWithProvider>;
  uploadProfileImage: (file: File) => Promise<string>;
  isAuthenticated: boolean;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserWithProvider | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Define the API base URL explicitly - IMPORTANT: ensure it has /api in the path
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  // Hydrate from localStorage
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem("authToken");
      const u = localStorage.getItem("user");
      
      if (storedToken && u) {
        authLogger.debug("Restoring session from localStorage");
        setToken(storedToken);
        
        // Set the authorization header for apiClient
        if (apiClient.client?.defaults?.headers) {
          apiClient.client.defaults.headers.common["Authorization"] =
            "Bearer " + storedToken;
          authLogger.debug("Set authorization header for client");
        }
        
        try {
          const userData = JSON.parse(u);
          setUser(userData);
          authLogger.info("User session restored", { userId: userData.id, role: userData.role });

          // Check if user is a provider but doesn't have provider data
          if (userData.role === 'PROVIDER' && !userData.provider) {
            // Fetch provider data
            fetchProviderData(userData.id);
          }
        } catch (parseError) {
          authLogger.error("Failed to parse user data from localStorage", parseError);
          // Clear invalid data
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
        }
      } else {
        authLogger.debug("No stored auth session found");
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  // Function to fetch provider data
  const fetchProviderData = async (userId: string) => {
    try {
      authLogger.debug(`Fetching provider data`, { userId });
      
      // Use direct axios to ensure the right URL
      const response = await axios.get(`${API_BASE_URL}/providers/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`
        }
      });
      
      if (response.data) {
        authLogger.info("Provider data fetched successfully", { providerId: response.data.id });
        
        // Update user with provider data
        const updatedUser = { ...user, provider: response.data };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (err) {
      authLogger.error("Error fetching provider data", err);
      // Don't set an error - this is a background fetch
    }
  };

  const clearError = () => setError(null);

  const login = async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    
    authLogger.debug("Login attempt initiated", { email });

    // Validate inputs before making the API call
    if (!email || !password) {
      const errorMsg = "Email and password are required";
      setError(errorMsg);
      setLoading(false);
      authLogger.warn("Login validation failed", { reason: errorMsg });
      throw new Error(errorMsg);
    }
    
    try {
      authLogger.debug("Making login API call");
      
      // Use direct axios call to ensure correct URL with /api prefix
      const response = await axios.post(`${API_BASE_URL}/auth/login`, { 
        email, 
        password 
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const responseData = response.data;
      
      if (!responseData || (!responseData.user && !responseData.token)) {
        throw new Error('Invalid response format from server');
      }
      
      const { user, token: newToken } = responseData;
      
      // Update token state
      setToken(newToken);
      
      // Set auth header for future requests
      if (apiClient.client?.defaults?.headers) {
        apiClient.client.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      }
      
      authLogger.info("Login successful", { userId: user.id, role: user.role });
      
      // If user is a provider, fetch provider data
      if (user.role === 'PROVIDER') {
        authLogger.debug("User is a provider, fetching provider data");
        try {
          const providerResponse = await axios.get(`${API_BASE_URL}/providers/user/${user.id}`, {
            headers: {
              Authorization: `Bearer ${newToken}`
            }
          });
          
          if (providerResponse.data) {
            // Add provider data to user
            user.provider = providerResponse.data;
            authLogger.debug("Provider data fetched successfully", { providerId: providerResponse.data.id });
          }
        } catch (providerErr) {
          authLogger.warn("Error fetching provider data during login", providerErr);
          // Continue with login even if provider fetch fails
        }
      }
      
      setUser(user);
      localStorage.setItem("authToken", newToken);
      localStorage.setItem("user", JSON.stringify(user));
      
      return user;
    } catch (err: any) {
      authLogger.error("Login failed", err);
      
      // Better error handling for axios errors
      let errorMessage = "Login failed";
      if (err.response) {
        errorMessage = err.response.data?.message || 'Server error';
      } else if (err.request) {
        errorMessage = 'No response from server';
      } else {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authLogger.info("User logout", { userId: user?.id });
    setUser(null);
    setToken(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    if (apiClient.client?.defaults?.headers?.common) {
      delete apiClient.client.defaults.headers.common["Authorization"];
    }
    router.push("/");
  };

  const register = async (data: RegisterRequest) => {
    setError(null);
    setLoading(true);
    
    authLogger.debug("Registration attempt", { email: data.email, role: data.role });
    
    // Validate inputs
    if (!data.email || !data.password || !data.firstName || !data.lastName) {
      const errorMsg = "All required fields must be filled";
      setError(errorMsg);
      setLoading(false);
      authLogger.warn("Registration validation failed", { reason: errorMsg });
      throw new Error(errorMsg);
    }
    
    try {
      // Use direct axios for consistent URL handling
      const response = await axios.post(`${API_BASE_URL}/auth/register`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const responseData = response.data;
      
      if (!responseData || (!responseData.user && !responseData.token)) {
        throw new Error('Invalid response format from server');
      }
      
      const { user, token: newToken } = responseData;
      
      // Update token state
      setToken(newToken);
      
      // Set auth header for future requests
      if (apiClient.client?.defaults?.headers) {
        apiClient.client.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      }
      
      authLogger.info("Registration successful", { userId: user.id, role: user.role });
      
      // If user is a provider, fetch provider data
      if (user.role === 'PROVIDER') {
        authLogger.debug("New user is a provider, fetching provider data");
        try {
          const providerResponse = await axios.get(`${API_BASE_URL}/providers/user/${user.id}`, {
            headers: {
              Authorization: `Bearer ${newToken}`
            }
          });
          
          if (providerResponse.data) {
            // Add provider data to user
            user.provider = providerResponse.data;
            authLogger.debug("Provider data fetched for new user", { providerId: providerResponse.data.id });
          }
        } catch (providerErr) {
          authLogger.warn("Error fetching provider data during registration", providerErr);
          // Continue with registration even if provider fetch fails
        }
      }
      
      setUser(user);
      localStorage.setItem("authToken", newToken);
      localStorage.setItem("user", JSON.stringify(user));
      
      return user;
    } catch (err: any) {
      authLogger.error("Registration failed", err);
      
      let errorMessage = "Registration failed";
      if (err.response) {
        errorMessage = err.response.data?.message || 'Server error';
      } else if (err.request) {
        errorMessage = 'No response from server';
      } else {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setError(null);
    setLoading(true);
    
    authLogger.debug("Password reset request initiated", { email });
    
    try {
      await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });
      authLogger.info("Password reset email sent", { email });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to send reset email";
      authLogger.error("Password reset request failed", { email, error: errorMessage });
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (resetToken: string, password: string) => {
    setError(null);
    setLoading(true);
    
    authLogger.debug("Password reset attempt with token");
    
    try {
      await axios.post(`${API_BASE_URL}/auth/reset-password`, { token: resetToken, password });
      authLogger.info("Password reset successful");
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Reset failed";
      authLogger.error("Password reset failed", { error: errorMessage });
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (data: ChangePasswordRequest) => {
    setError(null);
    setLoading(true);
    
    authLogger.debug("Password change attempt", { userId: user?.id });
    
    try {
      await axios.post(`${API_BASE_URL}/auth/change-password`, data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      authLogger.info("Password changed successfully", { userId: user?.id });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Change password failed";
      authLogger.error("Password change failed", { userId: user?.id, error: errorMessage });
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: UpdateProfileRequest) => {
    setError(null);
    setLoading(true);
    
    authLogger.debug("Profile update attempt", { userId: user?.id });
    
    try {
      const response = await axios.put(`${API_BASE_URL}/auth/profile`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const updated = response.data;
      
      // Preserve provider data if it existed
      if (user?.provider && !updated.provider) {
        updated.provider = user.provider;
      }
      
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
      
      authLogger.info("Profile updated successfully", { userId: updated.id });
      return updated;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Profile update failed";
      authLogger.error("Profile update failed", { userId: user?.id, error: errorMessage });
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const uploadProfileImage = async (file: File) => {
    setError(null);
    setLoading(true);
    
    authLogger.debug("Profile image upload attempt", { userId: user?.id, fileSize: file.size });
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await axios.post(`${API_BASE_URL}/auth/upload-avatar`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const { profileImageUrl } = response.data;
      
      if (user) {
        const u2 = { ...user, profileImageUrl };
        setUser(u2);
        localStorage.setItem("user", JSON.stringify(u2));
        authLogger.info("Profile image uploaded successfully", { userId: user.id });
      }
      return profileImageUrl;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Upload failed";
      authLogger.error("Profile image upload failed", { userId: user?.id, error: errorMessage });
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        logout,
        register,
        forgotPassword,
        resetPassword,
        changePassword,
        updateProfile,
        uploadProfileImage,
        isAuthenticated: !!token,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

export default AuthContext;
