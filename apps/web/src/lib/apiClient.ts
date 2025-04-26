
// src/lib/apiClient.ts
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { apiLogger, createReqId, cfg } from '@/lib/logger';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
  traceId?: string;
}

class ApiClient {
  public client: AxiosInstance;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api') {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    });
    this.setupInterceptors();
    apiLogger.info('ApiClient initialized', { baseUrl });
  }

  private setupInterceptors() {
    this.client.interceptors.request.use((config) => {
      const reqId = createReqId('R');
      config.headers = config.headers || {};
      config.headers['x-request-id'] = reqId;
      (config as any)._reqId = reqId;
      (config as any)._t0 = performance.now();

      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('authToken');
        if (token) config.headers['Authorization'] = `Bearer ${token}`;
      }

      if (cfg.group && typeof console.groupCollapsed === 'function') {
        console.groupCollapsed(`[API ▶️] ${reqId} ${config.method?.toUpperCase()} ${config.url}`);
        console.info('Request details', {
          method: config.method?.toUpperCase(),
          url: config.url,
          params: config.params || {},
          data: config.data || {},
        });
      }

      return config;
    });

    this.client.interceptors.response.use(
      (res) => {
        const { _reqId, _t0 } = res.config as any;
        const ms = Math.round(performance.now() - (_t0 || 0));
        const size = res.headers['content-length']
          ? `${res.headers['content-length']} B`
          : `${(JSON.stringify(res.data).length / 1024).toFixed(1)} kB`;

        if (cfg.group && typeof console.groupEnd === 'function') {
          console.groupEnd();
        }

        return res;
      },
      (error: AxiosError) => {
        const config = error.config || {};
        const { _reqId, _t0 } = config as any;
        const ms = Math.round(performance.now() - (_t0 || 0));
        const status = error.response?.status || 500;
        const message = this.extractErrorMessage(error);
        const traceId = error.response?.headers?.['x-trace-id'];

        apiLogger.error(`❌ ${_reqId} ${config.url} → ${status} (${ms} ms)`, { message, traceId });

        if (cfg.group && typeof console.groupEnd === 'function') {
          console.groupEnd();
        }

        return Promise.reject(error);
      }
    );
  }

  private extractErrorMessage(error: AxiosError): string {
    const data = error.response?.data as any;
    return data?.message || data?.error || error.message || 'Unknown error';
  }

  private handleResponse<T>(response: any): T {
    if (response?.success !== undefined && 'data' in response) {
      return response.data as T;
    }
    return response as T;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const res = await this.client.get<ApiResponse<T>>(url, config);
    return this.handleResponse(res.data);
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const res = await this.client.post<ApiResponse<T>>(url, data ?? {}, config);
    return this.handleResponse(res.data);
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const res = await this.client.put<ApiResponse<T>>(url, data, config);
    return this.handleResponse(res.data);
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const res = await this.client.patch<ApiResponse<T>>(url, data, config);
    return this.handleResponse(res.data);
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const res = await this.client.delete<ApiResponse<T>>(url, config);
    return this.handleResponse(res.data);
  }

  async uploadFile<T>(url: string, formData: FormData): Promise<T> {
    const res = await this.client.post<ApiResponse<T>>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return this.handleResponse(res.data);
  }
}

const apiClient = new ApiClient();
export default apiClient;

