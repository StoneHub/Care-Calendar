import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { Caregiver, Shift, Notification, Week } from '../../types';
import { logger } from '../../utils/logger';

/**
 * Enhanced API service with better error handling
 */
class APIService {
  private api: AxiosInstance;
  private requestTimeouts: Map<string, ReturnType<typeof setTimeout>>;
  private retryLimit: number = 2; 
  private retryDelay: number = 1000; // 1 second delay between retries
  
  constructor() {
    this.api = axios.create({
      baseURL: 'http://localhost:3001/api',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });
    
    this.requestTimeouts = new Map();
    
    // Setup request interceptor
    this.api.interceptors.request.use(
      this.handleRequest.bind(this),
      this.handleRequestError.bind(this)
    );
    
    // Setup response interceptor
    this.api.interceptors.response.use(
      this.handleResponse.bind(this),
      this.handleResponseError.bind(this)
    );
  }
  
  /**
   * Request interceptor - log outgoing requests
   */
  private handleRequest(config: any): any {
    const requestId = this.generateRequestId();
    
    // Add request ID for tracking
    config.headers = config.headers || {};
    config.headers['X-Request-ID'] = requestId;
    
    // Log the request
    logger.info('API Request', {
      id: requestId,
      method: config.method?.toUpperCase(),
      url: config.url,
      data: config.data,
      params: config.params
    });
    
    return config;
  }
  
  /**
   * Request error interceptor - handle request setup failures
   */
  private handleRequestError(error: any): Promise<never> {
    logger.error('API Request Error', {
      error: error.message,
      stack: error.stack
    });
    
    return Promise.reject(this.normalizeError(error));
  }
  
  /**
   * Response interceptor - log successful responses
   */
  private handleResponse(response: AxiosResponse): AxiosResponse {
    const requestId = response.config.headers?.['X-Request-ID'] || 'unknown';
    
    logger.info('API Response', {
      id: requestId,
      status: response.status,
      url: response.config.url,
      data: response.data ? (typeof response.data === 'object' ? 'object' : response.data) : null
    });
    
    return response;
  }
  
  /**
   * Response error interceptor - handle API errors with retry logic
   */
  private async handleResponseError(error: AxiosError): Promise<any> {
    const config = error.config;
    if (!config) return Promise.reject(this.normalizeError(error));
    
    const requestId = config.headers?.['X-Request-ID'] || 'unknown';
    const currentRetry = config.headers?.['X-Retry-Count'] ? 
      parseInt(config.headers['X-Retry-Count'] as string) : 0;
    
    // Log the error
    logger.error('API Response Error', {
      id: requestId,
      url: config.url,
      method: config.method?.toUpperCase(),
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      retryCount: currentRetry
    });
    
    // Check if we should retry the request
    if (this.shouldRetry(error, currentRetry)) {
      logger.info('Retrying request', {
        id: requestId,
        url: config.url,
        method: config.method?.toUpperCase(),
        retryCount: currentRetry + 1
      });
      
      // Increment retry count
      config.headers = config.headers || {};
      config.headers['X-Retry-Count'] = (currentRetry + 1).toString();
      
      // Delay before retry
      await this.delay(this.retryDelay * Math.pow(2, currentRetry));
      
      // Retry the request
      return this.api.request(config);
    }
    
    // Cannot retry, reject with normalized error
    return Promise.reject(this.normalizeError(error));
  }
  
  /**
   * Decides if a request should be retried
   */
  private shouldRetry(error: AxiosError, currentRetry: number): boolean {
    // Don't retry if we've hit the retry limit
    if (currentRetry >= this.retryLimit) {
      return false;
    }
    
    // Only retry specific status codes or network errors
    if (error.response) {
      // Retry 5xx errors (server errors)
      return error.response.status >= 500 && error.response.status < 600;
    } else {
      // Retry network errors (ECONNRESET, ETIMEDOUT, etc.)
      return error.code !== 'ECONNABORTED'; // Don't retry timeout errors
    }
  }
  
  /**
   * Normalizes various error types into a standard format
   */
  private normalizeError(error: any): Error {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;
      
      let message = 'Server error';
      
      if (typeof data === 'string') {
        message = data;
      } else if (data && data.message) {
        message = data.message;
      } else if (data && data.error) {
        message = data.error;
      }
      
      const normalizedError = new Error(message);
      Object.assign(normalizedError, {
        status,
        data,
        isApiError: true,
        originalError: error
      });
      
      return normalizedError;
    } else if (error.request) {
      // Request was made but no response received
      const normalizedError = new Error('No response from server');
      Object.assign(normalizedError, {
        isNetworkError: true,
        originalError: error
      });
      
      return normalizedError;
    } else {
      // Error setting up the request
      return error;
    }
  }
  
  /**
   * Generates a unique request ID
   */
  private generateRequestId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  
  /**
   * Promise-based delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Generic request method with timeout cancellation
   */
  private async request<T>(
    method: string, 
    url: string, 
    config: AxiosRequestConfig = {}
  ): Promise<T> {
    // Cancel any existing requests to the same URL
    this.cancelExistingRequest(url);
    
    // Setup cancellation token
    const requestKey = `${method.toUpperCase()}:${url}`;
    const cancelTokenSource = axios.CancelToken.source();
    
    // Set cancel token on request
    config.cancelToken = cancelTokenSource.token;
    
    // Store the cancel token
    const timeoutId = setTimeout(() => {
      cancelTokenSource.cancel('Request took too long');
      this.requestTimeouts.delete(requestKey);
    }, 30000); // 30 second hard timeout
    
    this.requestTimeouts.set(requestKey, timeoutId);
    
    try {
      // Execute the request
      const response = await this.api.request<T>({
        ...config,
        method,
        url
      });
      
      return response.data;
    } finally {
      // Clear the timeout
      clearTimeout(timeoutId);
      this.requestTimeouts.delete(requestKey);
    }
  }
  
  /**
   * Cancels existing requests to the same URL
   */
  private cancelExistingRequest(url: string): void {
    // Find and clear any existing timeout for this URL
    Object.keys(this.requestTimeouts).forEach(key => {
      if (key.includes(url)) {
        clearTimeout(this.requestTimeouts.get(key)!);
        this.requestTimeouts.delete(key);
      }
    });
  }
  
  // REST API Methods
  
  // Team members
  async getTeamMembers(): Promise<Caregiver[]> {
    return this.request<Caregiver[]>('GET', '/team');
  }
  
  async getTeamMember(id: number): Promise<Caregiver> {
    return this.request<Caregiver>('GET', `/team/${id}`);
  }
  
  async createTeamMember(caregiver: Omit<Caregiver, 'id'>): Promise<Caregiver> {
    return this.request<Caregiver>('POST', '/team', { data: caregiver });
  }
  
  async updateTeamMember(caregiver: Caregiver): Promise<Caregiver> {
    return this.request<Caregiver>('PUT', `/team/${caregiver.id}`, { data: caregiver });
  }
  
  async deleteTeamMember(id: number): Promise<void> {
    return this.request<void>('DELETE', `/team/${id}`);
  }
  
  // Weeks
  async getAllWeeks(): Promise<Week[]> {
    return this.request<Week[]>('GET', '/schedule/weeks');
  }
  
  async getCurrentWeek(): Promise<Week> {
    return this.request<Week>('GET', '/schedule/weeks/current');
  }
  
  async createWeek(week: Omit<Week, 'id'>): Promise<Week> {
    return this.request<Week>('POST', '/schedule/weeks', { data: week });
  }
  
  async updateWeek(week: Week): Promise<Week> {
    return this.request<Week>('PUT', `/schedule/weeks/${week.id}`, { data: week });
  }
  
  // Shifts
  async getScheduleForWeek(weekId: number): Promise<Shift[]> {
    return this.request<Shift[]>('GET', `/schedule/weeks/${weekId}/shifts`);
  }
  
  async getShift(id: number): Promise<Shift> {
    return this.request<Shift>('GET', `/schedule/shifts/${id}`);
  }
  
  async createShift(shift: any): Promise<Shift> {
    return this.request<Shift>('POST', '/schedule/shifts', { data: shift });
  }
  
  async updateShift(shift: Shift): Promise<Shift> {
    return this.request<Shift>('PUT', `/schedule/shifts/${shift.id}`, { data: shift });
  }
  
  async deleteShift(id: number): Promise<void> {
    return this.request<void>('DELETE', `/schedule/shifts/${id}`);
  }
  
  async dropShift(id: number, reason?: string): Promise<Shift> {
    return this.request<Shift>('POST', `/schedule/shifts/${id}/drop`, { data: { reason } });
  }
  
  async swapShift(id: number, swapWithId: number): Promise<{ original_shift: Shift, swap_with_shift: Shift }> {
    return this.request<{ original_shift: Shift, swap_with_shift: Shift }>(
      'POST', 
      `/schedule/shifts/${id}/swap`, 
      { data: { swap_with_id: swapWithId } }
    );
  }
  
  async adjustShift(id: number, newStartTime?: string, newEndTime?: string, reason?: string): Promise<Shift> {
    return this.request<Shift>(
      'POST', 
      `/schedule/shifts/${id}/adjust`, 
      { 
        data: { 
          new_start_time: newStartTime,
          new_end_time: newEndTime,
          reason
        } 
      }
    );
  }
  
  // Notifications
  async getAllNotifications(): Promise<Notification[]> {
    return this.request<Notification[]>('GET', '/notifications');
  }
  
  async getNotificationsByStatus(status: 'pending' | 'completed'): Promise<Notification[]> {
    return this.request<Notification[]>('GET', `/notifications/status/${status}`);
  }
  
  async approveNotification(id: number, caregiverId?: number): Promise<{ original: Notification, confirmation: Notification }> {
    return this.request<{ original: Notification, confirmation: Notification }>(
      'PUT', 
      `/notifications/${id}/approve`, 
      { data: { action_by_caregiver_id: caregiverId } }
    );
  }
}

// Create and export a singleton instance
export const apiService = new APIService();
