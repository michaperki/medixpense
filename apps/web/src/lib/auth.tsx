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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Hydrate from localStorage
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const u = localStorage.getItem("user");
    if (token && u) {
      if (apiClient.client?.defaults?.headers) {
        apiClient.client.defaults.headers.common["Authorization"] =
          "Bearer " + token;
      }
      const userData = JSON.parse(u);
      setUser(userData);

      // Check if user is a provider but doesn't have provider data
      if (userData.role === 'PROVIDER' && !userData.provider) {
        // Fetch provider data
        fetchProviderData(userData.id);
      }
    }
    setLoading(false);
  }, []);

  // Function to fetch provider data
  const fetchProviderData = async (userId: string) => {
    try {
      const response = await axios.get(`http://localhost:3001/api/providers/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`
        }
      });
      
      if (response.data) {
        // Update user with provider data
        const updatedUser = { ...user, provider: response.data };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error("Error fetching provider data:", err);
      // Don't set an error - this is a background fetch
    }
  };

  const clearError = () => setError(null);

  const login = async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    
    // Validate inputs before making the API call
    if (!email || !password) {
      setError("Email and password are required");
      setLoading(false);
      throw new Error("Email and password are required");
    }
    
    try {
      console.log('Attempting login with valid credentials:', { email });
      
      // Use axios directly to bypass any potential issues with your apiClient wrapper
      const response = await axios.post('http://localhost:3001/api/auth/login', { 
        email, 
        password 
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Raw axios response:', response);
      
      // Access the data property from the axios response
      const responseData = response.data;
      console.log('Response data:', responseData);
      
      if (!responseData || (!responseData.user && !responseData.token)) {
        throw new Error('Invalid response format from server');
      }
      
      const { user, token } = responseData;
      
      // Set auth header for future requests
      if (apiClient.client?.defaults?.headers) {
        apiClient.client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }
      
      // If user is a provider, fetch provider data
      if (user.role === 'PROVIDER') {
        try {
          const providerResponse = await axios.get(`http://localhost:3001/api/providers/user/${user.id}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (providerResponse.data) {
            // Add provider data to user
            user.provider = providerResponse.data;
          }
        } catch (providerErr) {
          console.error("Error fetching provider data:", providerErr);
          // Continue with login even if provider fetch fails
        }
      }
      
      setUser(user);
      localStorage.setItem("authToken", token);
      localStorage.setItem("user", JSON.stringify(user));
      
      return user;
    } catch (err: any) {
      console.error("Login Error:", err);
      
      // Better error handling for axios errors
      let errorMessage = "Login failed";
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Error response:", err.response.data);
        errorMessage = err.response.data.message || 'Server error';
      } else if (err.request) {
        // The request was made but no response was received
        errorMessage = 'No response from server';
      } else {
        // Something happened in setting up the request
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
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
    
    // Validate inputs
    if (!data.email || !data.password || !data.firstName || !data.lastName) {
      setError("All required fields must be filled");
      setLoading(false);
      throw new Error("All required fields must be filled");
    }
    
    try {
      // Use axios directly
      const response = await axios.post('http://localhost:3001/api/auth/register', data, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const responseData = response.data;
      
      if (!responseData || (!responseData.user && !responseData.token)) {
        throw new Error('Invalid response format from server');
      }
      
      const { user, token } = responseData;
      
      // Set auth header for future requests
      if (apiClient.client?.defaults?.headers) {
        apiClient.client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }
      
      // If user is a provider, fetch provider data
      if (user.role === 'PROVIDER') {
        try {
          const providerResponse = await axios.get(`http://localhost:3001/api/providers/user/${user.id}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (providerResponse.data) {
            // Add provider data to user
            user.provider = providerResponse.data;
          }
        } catch (providerErr) {
          console.error("Error fetching provider data during registration:", providerErr);
          // Continue with registration even if provider fetch fails
        }
      }
      
      setUser(user);
      localStorage.setItem("authToken", token);
      localStorage.setItem("user", JSON.stringify(user));
      
      return user;
    } catch (err: any) {
      console.error("Registration Error:", err);
      
      let errorMessage = "Registration failed";
      if (err.response) {
        errorMessage = err.response.data.message || 'Server error';
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

  // Rest of the methods remain the same
  const forgotPassword = async (email: string) => {
    setError(null);
    setLoading(true);
    try {
      await apiClient.post("/auth/forgot-password", { email });
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Failed to send reset email");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      await apiClient.post("/auth/reset-password", { token, password });
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Reset failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (data: ChangePasswordRequest) => {
    setError(null);
    setLoading(true);
    try {
      await apiClient.post("/auth/change-password", data);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Change password failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: UpdateProfileRequest) => {
    setError(null);
    setLoading(true);
    try {
      const updated = await apiClient.put<UserWithProvider>("/auth/profile", data);
      
      // Preserve provider data if it existed
      if (user?.provider && !updated.provider) {
        updated.provider = user.provider;
      }
      
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Profile update failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const uploadProfileImage = async (file: File) => {
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const { profileImageUrl } = await apiClient.uploadFile<{
        profileImageUrl: string;
      }>("/auth/upload-avatar", formData);
      
      if (user) {
        const u2 = { ...user, profileImageUrl };
        setUser(u2);
        localStorage.setItem("user", JSON.stringify(u2));
      }
      return profileImageUrl;
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Upload failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
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
        isAuthenticated: !!user,
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
