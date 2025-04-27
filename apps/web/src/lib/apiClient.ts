
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
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
    apiLogger.info('ApiClient ready', { baseUrl });
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
      
      // Simplified logging - just a single line with minimal context
      apiLogger.info(`▶️ ${reqId} ${config.method?.toUpperCase()} ${config.url}`, {
        // Only show params and data if they're small enough to be meaningful
        params: this.summarize(config.params),
        data: this.summarize(config.data),
      });
      
      return config;
    });
    
    this.client.interceptors.response.use(
      (res) => {
        const { _reqId, _t0 } = res.config as any;
        const ms = Math.round(performance.now() - (_t0 || 0));
        const size = this.getSize(res.data);
        
        // Single line response log with status, time and size
        apiLogger.info(`✅ ${_reqId} →${res.status} ${ms} ms ${size}`);
        
        return res;
      },
      (error: AxiosError) => {
        const config = error.config || {};
        const { _reqId, _t0 } = config as any;
        const ms = Math.round(performance.now() - (_t0 || 0));
        const status = error.response?.status || 500;
        const message = this.extractErrorMessage(error);
        
        // Concise error log
        apiLogger.warn(`❌ ${_reqId} →${status} ${ms} ms`, { message });
        
        return Promise.reject(error);
      }
    );
  }

  private summarize(obj: any) {
    if (!obj || typeof obj !== 'object') return obj;
    try {
      const size = JSON.stringify(obj).length;
      return size > 500 ? `[Payload ~${(size / 1024).toFixed(1)} kB]` : obj;
    } catch {
      return '[Unserializable]';
    }
  }

  private getSize(data: any) {
    try {
      const size = JSON.stringify(data).length;
      return `${(size / 1024).toFixed(1)} kB`;
    } catch {
      return '? kB';
    }
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

