
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
import { handleApiError } from "@/lib/api/handleApiError";
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

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    const u = localStorage.getItem("user");

    if (storedToken && u) {
      setToken(storedToken);

      if (apiClient.client?.defaults?.headers) {
        apiClient.client.defaults.headers.common["Authorization"] = "Bearer " + storedToken;
      }

      const userData = JSON.parse(u);
      setUser(userData);

      if (userData.role === "PROVIDER" && !userData.provider) {
        fetchProviderData(userData.id);
      }
    }
    setLoading(false);
  }, []);

  const fetchProviderData = async (userId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/providers/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (response.data) {
        const updatedUser = { ...user, provider: response.data };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (err) {
      handleApiError(err, "fetchProviderData"); // Centralized error handling
    }
  };

  const clearError = () => setError(null);

  const login = async (email: string, password: string) => {
    setError(null);
    setLoading(true);

    if (!email || !password) {
      setError("Email and password are required");
      setLoading(false);
      throw new Error("Email and password are required");
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password }, {
        headers: { "Content-Type": "application/json" },
      });

      const responseData = response.data;
      if (!responseData || (!responseData.user && !responseData.token)) {
        throw new Error("Invalid response format from server");
      }

      const { user, token: newToken } = responseData;
      setToken(newToken);

      if (apiClient.client?.defaults?.headers) {
        apiClient.client.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      }

      if (user.role === "PROVIDER") {
        await fetchProviderData(user.id);
      }

      setUser(user);
      localStorage.setItem("authToken", newToken);
      localStorage.setItem("user", JSON.stringify(user));

      return user;
    } catch (err: any) {
      handleApiError(err, "login"); // Centralized error handling
      setError("Login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
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

    if (!data.email || !data.password || !data.firstName || !data.lastName) {
      setError("All required fields must be filled");
      setLoading(false);
      throw new Error("All required fields must be filled");
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, data, {
        headers: { "Content-Type": "application/json" },
      });

      const responseData = response.data;
      if (!responseData || (!responseData.user && !responseData.token)) {
        throw new Error("Invalid response format from server");
      }

      const { user, token: newToken } = responseData;
      setToken(newToken);

      if (apiClient.client?.defaults?.headers) {
        apiClient.client.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      }

      if (user.role === "PROVIDER") {
        await fetchProviderData(user.id);
      }

      setUser(user);
      localStorage.setItem("authToken", newToken);
      localStorage.setItem("user", JSON.stringify(user));

      return user;
    } catch (err: any) {
      handleApiError(err, "register"); // Centralized error handling
      setError("Registration failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setError(null);
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });
    } catch (err: any) {
      handleApiError(err, "forgotPassword"); // Centralized error handling
      setError("Failed to send reset email");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (resetToken: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/auth/reset-password`, { token: resetToken, password });
    } catch (err: any) {
      handleApiError(err, "resetPassword"); // Centralized error handling
      setError("Reset failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (data: ChangePasswordRequest) => {
    setError(null);
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/auth/change-password`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err: any) {
      handleApiError(err, "changePassword"); // Centralized error handling
      setError("Change password failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: UpdateProfileRequest) => {
    setError(null);
    setLoading(true);
    try {
      const response = await axios.put(`${API_BASE_URL}/auth/profile`, data, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });

      const updated = response.data;

      if (user?.provider && !updated.provider) {
        updated.provider = user.provider;
      }

      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    } catch (err: any) {
      handleApiError(err, "updateProfile"); // Centralized error handling
      setError("Profile update failed");
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

      const response = await axios.post(`${API_BASE_URL}/auth/upload-avatar`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });

      const { profileImageUrl } = response.data;

      if (user) {
        const u2 = { ...user, profileImageUrl };
        setUser(u2);
        localStorage.setItem("user", JSON.stringify(u2));
      }

      return profileImageUrl;
    } catch (err: any) {
      handleApiError(err, "uploadProfileImage"); // Centralized error handling
      setError("Upload failed");
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

