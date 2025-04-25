
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import apiClient from "@/lib/apiClient";
import { authLogger } from "@/lib/logger";
import type {
  User,
  RegisterRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from "@/services";

/* ------------------------------------------------------------------
 * Types
 * ----------------------------------------------------------------*/

// Provider details attached to a user
export type Provider = {
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

export type UserWithProvider = User & { provider?: Provider };

export type AuthContextType = {
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

/* ------------------------------------------------------------------
 * Helpers
 * ----------------------------------------------------------------*/

const newReqId = () => Math.random().toString(36).slice(2, 5).toUpperCase();

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

/* ------------------------------------------------------------------
 * Context setup
 * ----------------------------------------------------------------*/

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserWithProvider | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  /* --------------------------------------------------------------
   * Session hydration
   * ------------------------------------------------------------*/
  useEffect(() => {
    const timer = authLogger.timer("BOOT – restore session");
    const storedToken = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        const parsed: UserWithProvider = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsed);
        apiClient.client?.defaults?.headers &&
          (apiClient.client.defaults.headers.common["Authorization"] =
            `Bearer ${storedToken}`);
        authLogger.info("Session restored", {
          userId: parsed.id,
          role: parsed.role,
        });

        // background fetch for missing provider data
        if (parsed.role === "PROVIDER" && !parsed.provider) {
          void fetchProviderData(parsed.id, storedToken);
        }
      } catch (err) {
        authLogger.error("Invalid session cache", err);
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
      }
    } else {
      authLogger.debug("No stored auth session found");
    }
    timer.done();
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --------------------------------------------------------------
   * API helpers
   * ------------------------------------------------------------*/

  const fetchProviderData = async (userId: string, authTok?: string) => {
    const reqId = newReqId();
    const t = authLogger.timer(`${reqId} GET /providers/user/${userId}`);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/providers/user/${userId}`, {
        headers: { Authorization: `Bearer ${authTok ?? token}` },
      });
      setUser((prev) => (prev ? { ...prev, provider: data } : prev));
      localStorage.setItem("user", JSON.stringify({ ...user, provider: data }));
      t.done();
    } catch (err) {
      t.fail(err);
    }
  };

  const clearError = () => setError(null);

  /* --------------------------------------------------------------
   * Auth actions
   * ------------------------------------------------------------*/

  const login = async (email: string, password: string) => {
    const reqId = newReqId();
    const t = authLogger.timer(`${reqId} POST /auth/login`);

    if (!email || !password) {
      const msg = "Email and password are required";
      authLogger.warn("Validation failed", { msg });
      setError(msg);
      t.fail(msg);
      throw new Error(msg);
    }

    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/auth/login`,
        { email, password },
        { headers: { "Content-Type": "application/json" } },
      );

      const { user: u, token: tok } = data;
      setToken(tok);
      setUser(u);
      apiClient.client?.defaults?.headers &&
        (apiClient.client.defaults.headers.common["Authorization"] =
          `Bearer ${tok}`);
      localStorage.setItem("authToken", tok);
      localStorage.setItem("user", JSON.stringify(u));

      // fetch provider if needed
      if (u.role === "PROVIDER" && !u.provider) {
        void fetchProviderData(u.id, tok);
      }

      t.done();
      return u;
    } catch (err: any) {
      t.fail(err);
      handleAxiosError(err, "Login failed");
    }
  };

  const logout = () => {
    authLogger.info("User logout", { userId: user?.id });
    setUser(null);
    setToken(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    apiClient.client?.defaults?.headers?.common &&
      delete apiClient.client.defaults.headers.common["Authorization"];
    router.push("/");
  };

  const register = async (data: RegisterRequest) => {
    const reqId = newReqId();
    const t = authLogger.timer(`${reqId} POST /auth/register`);

    if (!data.email || !data.password || !data.firstName || !data.lastName) {
      const msg = "All required fields must be filled";
      authLogger.warn("Validation failed", { msg });
      setError(msg);
      t.fail(msg);
      throw new Error(msg);
    }

    try {
      const { data: res } = await axios.post(
        `${API_BASE_URL}/auth/register`,
        data,
        { headers: { "Content-Type": "application/json" } },
      );

      const { user: u, token: tok } = res;
      setToken(tok);
      setUser(u);
      apiClient.client?.defaults?.headers &&
        (apiClient.client.defaults.headers.common["Authorization"] =
          `Bearer ${tok}`);
      localStorage.setItem("authToken", tok);
      localStorage.setItem("user", JSON.stringify(u));

      if (u.role === "PROVIDER") {
        void fetchProviderData(u.id, tok);
      }

      t.done();
      return u;
    } catch (err) {
      t.fail(err);
      handleAxiosError(err, "Registration failed");
    }
  };

  const forgotPassword = async (email: string) => {
    const reqId = newReqId();
    const t = authLogger.timer(`${reqId} POST /auth/forgot-password`);
    try {
      await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });
      t.done();
    } catch (err) {
      t.fail(err);
      handleAxiosError(err, "Failed to send reset email");
    }
  };

  const resetPassword = async (resetToken: string, password: string) => {
    const reqId = newReqId();
    const t = authLogger.timer(`${reqId} POST /auth/reset-password`);
    try {
      await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        token: resetToken,
        password,
      });
      t.done();
    } catch (err) {
      t.fail(err);
      handleAxiosError(err, "Reset password failed");
    }
  };

  const changePassword = async (data: ChangePasswordRequest) => {
    const reqId = newReqId();
    const t = authLogger.timer(`${reqId} POST /auth/change-password`);
    try {
      await axios.post(`${API_BASE_URL}/auth/change-password`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      t.done();
    } catch (err) {
      t.fail(err);
      handleAxiosError(err, "Change password failed");
    }
  };

  const updateProfile = async (data: UpdateProfileRequest) => {
    const reqId = newReqId();
    const t = authLogger.timer(`${reqId} PUT /auth/profile`);
    try {
      const { data: updated } = await axios.put(
        `${API_BASE_URL}/auth/profile`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      setUser((prev) => ({ ...prev, ...updated } as UserWithProvider));
      localStorage.setItem("user", JSON.stringify({ ...user, ...updated }));
      t.done();
      return updated;
    } catch (err) {
      t.fail(err);
      handleAxiosError(err, "Profile update failed");
    }
  };

  const uploadProfileImage = async (file: File) => {
    const reqId = newReqId();
    const t = authLogger.timer(`${reqId} POST /auth/upload-avatar`);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const {
        data: { profileImageUrl },
      } = await axios.post(`${API_BASE_URL}/auth/upload-avatar`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setUser((prev) =>
        prev ? ({ ...prev, profileImageUrl } as UserWithProvider) : prev,
      );
      localStorage.setItem(
        "user",
        JSON.stringify({ ...user, profileImageUrl }),
      );
      t.done();
      return profileImageUrl;
    } catch (err) {
      t.fail(err);
      handleAxiosError(err, "Upload failed");
    }
  };

  /* --------------------------------------------------------------
   * Error handling helper
   * ------------------------------------------------------------*/
  const handleAxiosError = (err: any, fallback: string): never => {
    const message = err.response?.data?.message ??
      (err.request ? "No response from server" : err.message) ??
      fallback;
    setError(message);
    throw err;
  };

  /* --------------------------------------------------------------
   * Provider value
   * ------------------------------------------------------------*/
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

