/**
 * Production-Ready API Client
 * 
 * Replaces mock data with real API calls using proper state management
 * Includes error handling, caching, retry logic, and request/response interceptors
 * 
 * @version 1.2.1
 */

import { logger } from './logger';

// API configuration
interface ApiConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  enableCache: boolean;
  cacheTTL: number;
  enableLogging: boolean;
}

// Request configuration
interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheTTL?: number;
}

// Response interface
interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestConfig;
}

// Error interface
interface ApiError extends Error {
  status?: number;
  statusText?: string;
  config?: RequestConfig;
  response?: any;
}

// Cache entry
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

// Default configuration
const DEFAULT_CONFIG: ApiConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://api.neurolint.dev',
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
  enableCache: true,
  cacheTTL: 5 * 60 * 1000, // 5 minutes
  enableLogging: process.env.NODE_ENV !== 'production'
};

/**
 * Production-ready API client class
 */
class ApiClient {
  private config: ApiConfig;
  private cache: Map<string, CacheEntry> = new Map();
  private requestInterceptors: Array<(config: RequestConfig) => RequestConfig> = [];
  private responseInterceptors: Array<(response: ApiResponse) => ApiResponse> = [];
  private errorInterceptors: Array<(error: ApiError) => ApiError> = [];

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.setupDefaultInterceptors();
  }

  /**
   * Setup default interceptors
   */
  private setupDefaultInterceptors() {
    // Request interceptor for authentication
    this.addRequestInterceptor((config) => {
      const token = this.getAuthToken();
      if (token) {
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${token}`
        };
      }
      return config;
    });

    // Request interceptor for logging
    if (this.config.enableLogging) {
      this.addRequestInterceptor((config) => {
        logger.debug(`API Request: ${config.method} - Headers: ${JSON.stringify(config.headers)} - Body: ${JSON.stringify(config.body)}`);
        return config;
      });
    }

    // Response interceptor for logging
    if (this.config.enableLogging) {
      this.addResponseInterceptor((response) => {
        logger.debug(`API Response: ${response.status} ${response.statusText} - Data: ${JSON.stringify(response.data)}`);
        return response;
      });
    }

    // Error interceptor for logging
    this.addErrorInterceptor((error) => {
      logger.error(`API Error: ${error.status} ${error.statusText} - ${error.message} - Config: ${JSON.stringify(error.config)}`);
      return error;
    });
  }

  /**
   * Get authentication token
   */
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    }
    return null;
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(url: string, config: RequestConfig): string {
    const method = config.method || 'GET';
    const body = config.body ? JSON.stringify(config.body) : '';
    return `${method}:${url}:${body}`;
  }

  /**
   * Get cached response
   */
  private getCachedResponse(cacheKey: string): any | null {
    if (!this.config.enableCache) {
      return null;
    }

    const entry = this.cache.get(cacheKey);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cached response
   */
  private setCachedResponse(cacheKey: string, data: any, ttl?: number): void {
    if (!this.config.enableCache) {
      return;
    }

    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.cacheTTL
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor: (config: RequestConfig) => RequestConfig): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor: (response: ApiResponse) => ApiResponse): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Add error interceptor
   */
  addErrorInterceptor(interceptor: (error: ApiError) => ApiError): void {
    this.errorInterceptors.push(interceptor);
  }

  /**
   * Apply request interceptors
   */
  private applyRequestInterceptors(config: RequestConfig): RequestConfig {
    return this.requestInterceptors.reduce((config, interceptor) => {
      return interceptor(config);
    }, config);
  }

  /**
   * Apply response interceptors
   */
  private applyResponseInterceptors(response: ApiResponse): ApiResponse {
    return this.responseInterceptors.reduce((response, interceptor) => {
      return interceptor(response);
    }, response);
  }

  /**
   * Apply error interceptors
   */
  private applyErrorInterceptors(error: ApiError): ApiError {
    return this.errorInterceptors.reduce((error, interceptor) => {
      return interceptor(error);
    }, error);
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest<T = any>(
    url: string, 
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const fullConfig: RequestConfig = {
      method: 'GET',
      timeout: this.config.timeout,
      retries: this.config.retries,
      cache: this.config.enableCache,
      cacheTTL: this.config.cacheTTL,
      ...config
    };

    // Apply request interceptors
    const interceptedConfig = this.applyRequestInterceptors(fullConfig);

    // Check cache for GET requests
    if (interceptedConfig.method === 'GET' && interceptedConfig.cache) {
      const cacheKey = this.generateCacheKey(url, interceptedConfig);
      const cachedData = this.getCachedResponse(cacheKey);
      if (cachedData) {
        return {
          data: cachedData,
          status: 200,
          statusText: 'OK (Cached)',
          headers: {},
          config: interceptedConfig
        };
      }
    }

    let lastError: ApiError;
    
    for (let attempt = 0; attempt <= (interceptedConfig.retries || 0); attempt++) {
      try {
        const response = await this.executeRequest(url, interceptedConfig);
        
        // Apply response interceptors
        const interceptedResponse = this.applyResponseInterceptors(response);

        // Cache successful GET responses
        if (interceptedConfig.method === 'GET' && interceptedConfig.cache) {
          const cacheKey = this.generateCacheKey(url, interceptedConfig);
          this.setCachedResponse(cacheKey, interceptedResponse.data, interceptedConfig.cacheTTL);
        }

        return interceptedResponse;
      } catch (error) {
        lastError = this.createApiError(error, interceptedConfig);
        
        // Don't retry on client errors (4xx)
        if (lastError.status && lastError.status >= 400 && lastError.status < 500) {
          break;
        }

        // Wait before retry (except on last attempt)
        if (attempt < (interceptedConfig.retries || 0)) {
          await this.delay(this.config.retryDelay);
        }
      }
    }

    // Apply error interceptors
    const interceptedError = this.applyErrorInterceptors(lastError!);
    throw interceptedError;
  }

  /**
   * Execute single HTTP request
   */
  private async executeRequest<T = any>(
    url: string, 
    config: RequestConfig
  ): Promise<ApiResponse<T>> {
    const fullUrl = url.startsWith('http') ? url : `${this.config.baseURL}${url}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout || this.config.timeout);

    try {
      const response = await fetch(fullUrl, {
        method: config.method,
        headers: {
          'Content-Type': 'application/json',
          ...config.headers
        },
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        config
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Create API error
   */
  private createApiError(error: any, config: RequestConfig): ApiError {
    const apiError = new Error(error.message || 'API request failed') as ApiError;
    apiError.config = config;
    
    if (error.name === 'AbortError') {
      apiError.message = 'Request timeout';
      apiError.status = 408;
    } else if (error.status) {
      apiError.status = error.status;
      apiError.statusText = error.statusText;
      apiError.response = error.response;
    }

    return apiError;
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { ...config, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { ...config, method: 'POST', body: data });
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { ...config, method: 'PUT', body: data });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { ...config, method: 'DELETE' });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { ...config, method: 'PATCH', body: data });
  }

  /**
   * Upload file
   */
  async upload<T = any>(url: string, file: File, config?: RequestConfig): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.makeRequest<T>(url, {
      ...config,
      method: 'POST',
      body: formData,
      headers: {
        ...config?.headers,
        // Don't set Content-Type for FormData
      }
    });
  }

  /**
   * Download file
   */
  async download(url: string, filename?: string, config?: RequestConfig): Promise<void> {
    try {
      const response = await this.makeRequest(url, { ...config, method: 'GET' });
      
      if (typeof window === 'undefined') {
        throw new Error('Download is only available in browser environment');
      }
      
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      throw new Error(`Download failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Create default API client instance
const apiClient = new ApiClient();

// Export API client instance and class
export { apiClient, ApiClient };

// Export convenience functions
export const api = {
  get: <T = any>(url: string, config?: RequestConfig) => apiClient.get<T>(url, config),
  post: <T = any>(url: string, data?: any, config?: RequestConfig) => apiClient.post<T>(url, data, config),
  put: <T = any>(url: string, data?: any, config?: RequestConfig) => apiClient.put<T>(url, data, config),
  delete: <T = any>(url: string, config?: RequestConfig) => apiClient.delete<T>(url, config),
  patch: <T = any>(url: string, data?: any, config?: RequestConfig) => apiClient.patch<T>(url, data, config),
  upload: <T = any>(url: string, file: File, config?: RequestConfig) => apiClient.upload<T>(url, file, config),
  download: (url: string, filename?: string, config?: RequestConfig) => apiClient.download(url, filename, config)
};

// Export types
export type { ApiConfig, RequestConfig, ApiResponse, ApiError };

// Export for use in components
export default apiClient; 