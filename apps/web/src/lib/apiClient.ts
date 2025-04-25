// src/lib/apiClient.ts
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

function logResponse(reqId: string, config: AxiosRequestConfig, data: any, status: number) {
  const ms = Math.round(performance.now() - ((config as any)._t0 || 0));
  const size = `${(JSON.stringify(data).length / 1024).toFixed(1)} kB`;
  apiLogger.info(`✅ ${reqId} →${status} ${config.url} (${ms} ms, ${size})`);
}

function logError(reqId: string, config: AxiosRequestConfig, error: ApiError) {
  const ms = Math.round(performance.now() - ((config as any)._t0 || 0));
  apiLogger.error(`❌ ${reqId} ${config.url} → ${error.status} (${ms} ms)`, error);
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
      (config as any)._t0 = performance.now();

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
        logResponse(reqId, res.config, res.data, res.status);
        return res;
      },
      (error: AxiosError) => {
        const config = error.config || {};
        const reqId = (config as any)._reqId || '?';

        const err: ApiError = {
          status: error.response?.status || 500,
          message: this.extractErrorMessage(error),
          errors: this.extractValidationErrors(error),
          traceId: error.response?.headers?.['x-trace-id'],
        };

        if (err.status === 401 && typeof window !== 'undefined' && !config.url?.includes('/auth/login')) {
          apiLogger.warn(`${reqId} Unauthorized → redirecting to login`);
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        }

        logError(reqId, config, err);
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
    const t = apiLogger.timer(`GET ${url}`);
    try {
      const res = await this.client.get<T>(url, config);
      t.done();
      return this.handleResponse<T>(res.data);
    } catch (err) {
      t.fail(err);
      throw err;
    }
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const t = apiLogger.timer(`POST ${url}`);
    try {
      const res = await this.client.post<T>(url, data ?? {}, config);
      t.done();
      return this.handleResponse<T>(res.data);
    } catch (err) {
      t.fail(err);
      throw err;
    }
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const t = apiLogger.timer(`PUT ${url}`);
    try {
      const res = await this.client.put<T>(url, data, config);
      t.done();
      return this.handleResponse<T>(res.data);
    } catch (err) {
      t.fail(err);
      throw err;
    }
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const t = apiLogger.timer(`PATCH ${url}`);
    try {
      const res = await this.client.patch<T>(url, data, config);
      t.done();
      return this.handleResponse<T>(res.data);
    } catch (err) {
      t.fail(err);
      throw err;
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const t = apiLogger.timer(`DELETE ${url}`);
    try {
      const res = await this.client.delete<T>(url, config);
      t.done();
      return this.handleResponse<T>(res.data);
    } catch (err) {
      t.fail(err);
      throw err;
    }
  }

  async uploadFile<T>(url: string, formData: FormData): Promise<T> {
    const fileSummary: string[] = [];
    formData.forEach((value, key) => {
      if (value instanceof File) fileSummary.push(`${key}: ${value.name} (${value.size} bytes)`);
    });

    apiLogger.group('Uploading files', () => {
      apiLogger.info('▶️ File upload', { url, files: fileSummary });
    });

    const res = await this.client.post<T>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    apiLogger.info('✅ File upload completed', { url, status: res.status });
    return this.handleResponse<T>(res.data);
  }
}

const apiClient = new ApiClient();
export default apiClient;
