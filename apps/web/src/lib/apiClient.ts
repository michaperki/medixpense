import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { apiLogger } from '@/lib/logger';

// API response interface for standardized responses
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

// Error interface for consistent error handling
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
    // Request interceptor - add auth token if available
    this.client.interceptors.request.use((config) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('authToken');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      
      const url = `${this.baseUrl}${config.url}`;
      apiLogger.debug(`Request prepared`, { 
        url, 
        method: config.method?.toUpperCase(),
        hasBody: !!config.data
      });
      
      return config;
    });

    // Response interceptor - handle errors and unauthorized responses
    this.client.interceptors.response.use(
      (res) => res,
      (error: AxiosError) => {
        // Handle 401 unauthorized errors (except for login)
        if (error.response?.status === 401 && typeof window !== 'undefined') {
          const isLogin = error.config?.url?.includes('/auth/login');
          if (!isLogin) {
            apiLogger.warn('Unauthorized access detected, redirecting to login');
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
          }
        }

        // Format error for consistent handling
        const err: ApiError = {
          status: error.response?.status || 500,
          message: this.extractErrorMessage(error),
          errors: this.extractValidationErrors(error),
          traceId: error.response?.headers?.['x-trace-id'],
        };

        apiLogger.error('API request failed', { 
          url: error.config?.url,
          status: err.status,
          message: err.message,
          traceId: err.traceId
        });

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

  // Helper method to handle API responses with flexible structure
  private handleResponse<T>(response: any): T {
    apiLogger.debug('Processing API response');
    
    // Add a safety check for null or undefined responses
    if (response === null || response === undefined) {
      apiLogger.warn('Received null or undefined API response');
      return response as T;
    }
    
    // If the response follows the standard ApiResponse structure
    if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
      apiLogger.debug('Standard API response structure detected');
      return response.data as T;
    }
    
    // If the response is already in the expected format
    apiLogger.debug('Using direct response format');
    return response as T;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    apiLogger.group(`GET ${url}`, () => {
      apiLogger.debug('Request details', { params: config?.params });
    });
    
    try {
      const res = await this.client.get<T>(url, config);
      
      apiLogger.group(`Response: GET ${url}`, () => {
        apiLogger.debug('Status', { 
          status: res.status, 
          statusText: res.statusText 
        });
        apiLogger.debug('Response size', { 
          bytes: JSON.stringify(res.data).length 
        });
      });
      
      const processedResponse = this.handleResponse<T>(res.data);
      return processedResponse;
    } catch (error) {
      // Error is already logged in the interceptor
      throw error;
    }
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    apiLogger.group(`POST ${url}`, () => {
      apiLogger.debug('Request details', { 
        params: config?.params,
        dataFields: data ? Object.keys(data) : [] 
      });
    });
    
    try {
      const res = await this.client.post<T>(url, data ?? {}, config);
      
      apiLogger.group(`Response: POST ${url}`, () => {
        apiLogger.debug('Status', { 
          status: res.status, 
          statusText: res.statusText 
        });
        apiLogger.debug('Response size', { 
          bytes: JSON.stringify(res.data).length 
        });
      });
      
      const processedResponse = this.handleResponse<T>(res.data);
      return processedResponse;
    } catch (error) {
      // Error is already logged in the interceptor
      throw error;
    }
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    apiLogger.group(`PUT ${url}`, () => {
      apiLogger.debug('Request details', { 
        params: config?.params,
        dataFields: data ? Object.keys(data) : [] 
      });
    });
    
    try {
      const res = await this.client.put<T>(url, data, config);
      
      apiLogger.group(`Response: PUT ${url}`, () => {
        apiLogger.debug('Status', { 
          status: res.status, 
          statusText: res.statusText 
        });
        apiLogger.debug('Response size', { 
          bytes: JSON.stringify(res.data).length 
        });
      });
      
      const processedResponse = this.handleResponse<T>(res.data);
      return processedResponse;
    } catch (error) {
      // Error is already logged in the interceptor
      throw error;
    }
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    apiLogger.group(`PATCH ${url}`, () => {
      apiLogger.debug('Request details', { 
        params: config?.params,
        dataFields: data ? Object.keys(data) : [] 
      });
    });
    
    try {
      const res = await this.client.patch<T>(url, data, config);
      
      apiLogger.group(`Response: PATCH ${url}`, () => {
        apiLogger.debug('Status', { 
          status: res.status, 
          statusText: res.statusText 
        });
        apiLogger.debug('Response size', { 
          bytes: JSON.stringify(res.data).length 
        });
      });
      
      const processedResponse = this.handleResponse<T>(res.data);
      return processedResponse;
    } catch (error) {
      // Error is already logged in the interceptor
      throw error;
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    apiLogger.group(`DELETE ${url}`, () => {
      apiLogger.debug('Request details', { 
        params: config?.params 
      });
    });
    
    try {
      const res = await this.client.delete<T>(url, config);
      
      apiLogger.group(`Response: DELETE ${url}`, () => {
        apiLogger.debug('Status', { 
          status: res.status, 
          statusText: res.statusText 
        });
        apiLogger.debug('Response size', { 
          bytes: JSON.stringify(res.data).length 
        });
      });
      
      const processedResponse = this.handleResponse<T>(res.data);
      return processedResponse;
    } catch (error) {
      // Error is already logged in the interceptor
      throw error;
    }
  }

  async uploadFile<T>(url: string, formData: FormData): Promise<T> {
    apiLogger.group(`File upload to ${url}`, () => {
      // Log file information without logging the actual file contents
      const fileEntries: string[] = [];
      formData.forEach((value, key) => {
        if (value instanceof File) {
          fileEntries.push(`${key}: ${value.name} (${value.size} bytes)`);
        } else {
          fileEntries.push(key);
        }
      });
      
      apiLogger.debug('Upload details', { files: fileEntries });
    });
    
    try {
      const res = await this.client.post<T>(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      apiLogger.info('File upload completed successfully', {
        url,
        status: res.status
      });
      
      const processedResponse = this.handleResponse<T>(res.data);
      return processedResponse;
    } catch (error) {
      apiLogger.error('File upload failed', { url });
      throw error;
    }
  }
}

const apiClient = new ApiClient();
export default apiClient;
