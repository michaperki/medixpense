import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

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
      // Log the full URL being requested
      console.log(`Request to: ${this.baseUrl}${config.url}`);
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

        if (process.env.NODE_ENV === 'development') {
          console.error('API Error:', err);
        }

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
    console.log('ApiClient handleResponse input:', response);
    
    // Add a safety check for null or undefined responses
    if (response === null || response === undefined) {
      console.error('ApiClient received null or undefined response');
      return response as T;
    }
    
    // If the response follows the standard ApiResponse structure
    if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
      console.log('ApiClient: Standard API response structure detected');
      return response.data as T;
    }
    
    // If the response is already in the expected format
    console.log('ApiClient: Returning direct response');
    return response as T;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    console.log(`ApiClient: GET request to ${url}`, config);
    try {
      const res = await this.client.get<T>(url, config);
      console.log('→ Response data:', res.data);
      const processedResponse = this.handleResponse<T>(res.data);
      console.log('→ Processed response:', processedResponse);
      return processedResponse;
    } catch (error) {
      console.error(`ApiClient: Error in GET request to ${url}:`, error);
      throw error;
    }
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    console.log(`ApiClient: POST request to ${url}`, data);
    try {
      const res = await this.client.post<T>(url, data ?? {}, config);
      const processedResponse = this.handleResponse<T>(res.data);
      console.log('→ POST Response processed:', processedResponse);
      return processedResponse;
    } catch (error) {
      console.error(`ApiClient: Error in POST request to ${url}:`, error);
      throw error;
    }
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    console.log(`ApiClient: PUT request to ${url}`, data);
    try {
      const res = await this.client.put<T>(url, data, config);
      const processedResponse = this.handleResponse<T>(res.data);
      console.log('→ PUT Response processed:', processedResponse);
      return processedResponse;
    } catch (error) {
      console.error(`ApiClient: Error in PUT request to ${url}:`, error);
      throw error;
    }
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    console.log(`ApiClient: PATCH request to ${url}`, data);
    try {
      const res = await this.client.patch<T>(url, data, config);
      const processedResponse = this.handleResponse<T>(res.data);
      console.log('→ PATCH Response processed:', processedResponse);
      return processedResponse;
    } catch (error) {
      console.error(`ApiClient: Error in PATCH request to ${url}:`, error);
      throw error;
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    console.log(`ApiClient: DELETE request to ${url}`);
    try {
      const res = await this.client.delete<T>(url, config);
      const processedResponse = this.handleResponse<T>(res.data);
      console.log('→ DELETE Response processed:', processedResponse);
      return processedResponse;
    } catch (error) {
      console.error(`ApiClient: Error in DELETE request to ${url}:`, error);
      throw error;
    }
  }

  async uploadFile<T>(url: string, formData: FormData): Promise<T> {
    console.log(`ApiClient: File upload to ${url}`);
    try {
      const res = await this.client.post<T>(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const processedResponse = this.handleResponse<T>(res.data);
      console.log('→ Upload Response processed:', processedResponse);
      return processedResponse;
    } catch (error) {
      console.error(`ApiClient: Error in file upload to ${url}:`, error);
      throw error;
    }
  }
}

const apiClient = new ApiClient();
export default apiClient;
