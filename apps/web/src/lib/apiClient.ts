
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { apiLogger, createReqId } from '@/lib/logger';

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
  private baseUrl: string;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api') {
    this.baseUrl = baseUrl;
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

      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('authToken');
        if (token) config.headers['Authorization'] = `Bearer ${token}`;
      }

      apiLogger.info(`▶️ ${reqId} ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    this.client.interceptors.response.use(
      (res) => {
        const reqId = (res.config as any)._reqId || '?';
        apiLogger.info(`✅ ${reqId} →${res.status} ${res.config.url}`);
        return res;
      },
      (error: AxiosError) => {
        const config = error.config || {};
        const reqId = (config as any)._reqId || '?';

        if (error.response?.status === 401 && typeof window !== 'undefined') {
          if (!config.url?.includes('/auth/login')) {
            apiLogger.warn(`${reqId} Unauthorized → redirecting to login`);
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
          }
        }

        const err: ApiError = {
          status: error.response?.status || 500,
          message: this.extractErrorMessage(error),
          errors: this.extractValidationErrors(error),
          traceId: error.response?.headers?.['x-trace-id'],
        };

        apiLogger.error(`❌ ${reqId} ${config.url} → ${err.status}`, err);
        return Promise.reject(err);
      }
    );
  }

  private extractErrorMessage(error: AxiosError): string {
    const data = error.response?.data as any;
    return data?.message || data?.error || error.message || 'Unknown error';
  }

  private extractValidationErrors(error: AxiosError): Record<string, string[]> | undefined {
    const data = error.response?.data as any;
    return data?.errors || data?.error_fields;
  }

  private handleResponse<T>(response: any): T {
    if (response === null || response === undefined) {
      apiLogger.warn('Received null or undefined response');
      return response as T;
    }

    if (response?.success !== undefined && 'data' in response) {
      return response.data as T;
    }

    return response as T;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const res = await this.client.get<T>(url, config);
    return this.handleResponse<T>(res.data);
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const res = await this.client.post<T>(url, data ?? {}, config);
    return this.handleResponse<T>(res.data);
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const res = await this.client.put<T>(url, data, config);
    return this.handleResponse<T>(res.data);
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const res = await this.client.patch<T>(url, data, config);
    return this.handleResponse<T>(res.data);
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const res = await this.client.delete<T>(url, config);
    return this.handleResponse<T>(res.data);
  }

  async uploadFile<T>(url: string, formData: FormData): Promise<T> {
    const fileSummary: string[] = [];
    formData.forEach((value, key) => {
      if (value instanceof File) fileSummary.push(`${key}: ${value.name} (${value.size} bytes)`);
    });

    apiLogger.info('▶️ File upload', { url, files: fileSummary });

    const res = await this.client.post<T>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    apiLogger.info('✅ File upload completed', { url, status: res.status });
    return this.handleResponse<T>(res.data);
  }
}

const apiClient = new ApiClient();
export default apiClient;

