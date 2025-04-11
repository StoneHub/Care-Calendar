import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { Caregiver, Shift, Notification, Week, HistoryRecord, Unavailability, NewUnavailabilityData, UnavailabilityBackend } from '../../types';
import { logger } from '../../utils/logger';
import { API_BASE_URL } from '../../config';

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
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
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
      requestId,
      id: requestId, // Keep old field for backward compatibility
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
      requestId,
      id: requestId, // Keep old field for backward compatibility
      status: response.status,
      url: response.config.url,
      data: response.data ? (typeof response.data === 'object' ? 'object' : response.data) : null
    });
    
    return response;
  }
  
  /**
   * Response error interceptor - handle API errors
   */
  private async handleResponseError(error: AxiosError): Promise<any> {
    const config = error.config;
    if (!config) return Promise.reject(this.normalizeError(error));
    
    const requestId = config.headers?.['X-Request-ID'] || 'unknown';
    
    // Log the error
    logger.error('API Response Error', {
      requestId,
      id: requestId, // Keep old field for backward compatibility
      url: config.url,
      method: config.method?.toUpperCase(),
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // Always reject with normalized error to simplify error handling
    return Promise.reject(this.normalizeError(error));
  }
  
  // Removed shouldRetry as it's no longer needed with simplified error handling
  
  /**
   * Normalizes various error types into a standard format with user-friendly messages
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
      
      // Make error messages more user-friendly
      if (status === 400) {
        message = 'Invalid request data. Please check your inputs and try again.';
      } else if (status === 401) {
        message = 'Authentication required. Please log in again.';
      } else if (status === 403) {
        message = 'You do not have permission to perform this action.';
      } else if (status === 404) {
        message = 'The requested resource was not found.';
      } else if (status === 409) {
        message = 'This operation conflicts with the current state. The resource may have been modified.';
      } else if (status >= 500) {
        message = 'A server error occurred. Please try again later.';
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
      const message = 'Cannot connect to server. Please check your network connection.';
      const normalizedError = new Error(message);
      Object.assign(normalizedError, {
        isNetworkError: true,
        originalError: error
      });
      
      return normalizedError;
    } else {
      // Error setting up the request
      const normalizedError = new Error(error.message || 'An unexpected error occurred');
      Object.assign(normalizedError, {
        isRequestError: true,
        originalError: error
      });
      return normalizedError;
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
  
  async createTeamMember(caregiver: Omit<Caregiver, 'id' | 'is_active'>): Promise<Caregiver> {
    // Map frontend field names to backend field names
    const payload = {
      name: caregiver.name,
      role: caregiver.role,
      availability: caregiver.availability
    };
    
    return this.request<Caregiver>('POST', '/team', { data: payload });
  }
  
  async updateTeamMember(caregiver: Caregiver): Promise<Caregiver> {
    if (!caregiver.id || typeof caregiver.id !== 'number' || isNaN(caregiver.id)) {
      throw new Error('Invalid caregiver ID. Cannot update team member.');
    }
    
    // Map fields to match the expected backend format
    const payload = {
      name: caregiver.name,
      role: caregiver.role,
      availability: caregiver.availability,
      is_active: caregiver.is_active
    };
    
    return this.request<Caregiver>('PUT', `/team/${caregiver.id}`, { data: payload });
  }
  
  async toggleTeamMemberActive(id: number, isActive: boolean): Promise<Caregiver> {
    if (!id || typeof id !== 'number' || isNaN(id)) {
      throw new Error('Invalid team member ID. Cannot toggle active status.');
    }
    
    return this.request<Caregiver>('PUT', `/team/${id}`, { 
      data: { is_active: isActive }
    });
  }
  
  async deleteTeamMember(id: number, forceDelete: boolean = false): Promise<void> {
    if (!id || typeof id !== 'number' || isNaN(id)) {
      throw new Error('Invalid team member ID. Cannot delete.');
    }
    
    try {
      return await this.request<void>('DELETE', `/team/${id}?force=${forceDelete ? 'true' : 'false'}`);
    } catch (error: any) {
      // Add specific error handling for foreign key constraints
      if (error.status === 500) {
        const enhancedError = new Error('Cannot delete team member with assigned shifts');
        Object.assign(enhancedError, { status: 500, originalError: error });
        throw enhancedError;
      }
      throw error;
    }
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
    // Log the incoming shift data for debugging
    logger.debug('Creating shift with data', { 
      shift,
      hasIsRecurring: shift.hasOwnProperty('isRecurring'),
      isRecurringValue: shift.isRecurring
    });
    
    // Map frontend isRecurring and recurringEndDate to backend is_recurring and recurring_end_date
    const payload = {
      ...shift,
      is_recurring: shift.isRecurring,
      recurring_end_date: shift.recurringEndDate
    };
    
    // Remove frontend-specific properties
    delete payload.isRecurring;
    delete payload.recurringEndDate;
    
    // Log the final payload being sent to the backend
    logger.debug('Final shift payload', { 
      payload,
      hasIsRecurring: payload.hasOwnProperty('is_recurring'),
      isRecurringValue: payload.is_recurring
    });
    
    return this.request<Shift>('POST', '/schedule/shifts', { data: payload });
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
  
  // History Records
  async getHistoryRecords(filters?: {
    actionType?: string,
    entityType?: string,
    weekId?: number,
    limit?: number,
    offset?: number
  }): Promise<HistoryRecord[]> {
    const params: Record<string, string> = {};
    
    if (filters) {
      if (filters.actionType) params.action_type = filters.actionType;
      if (filters.entityType) params.entity_type = filters.entityType;
      if (filters.weekId) params.week_id = filters.weekId.toString();
      if (filters.limit) params.limit = filters.limit.toString();
      if (filters.offset) params.offset = filters.offset.toString();
    }
    
    return this.request<HistoryRecord[]>('GET', '/history', { params });
  }
  
  async getEntityHistory(entityType: string, entityId: number): Promise<HistoryRecord[]> {
    return this.request<HistoryRecord[]>('GET', `/history/entity/${entityType}/${entityId}`);
  }
  
  async getWeekHistory(weekId: number): Promise<HistoryRecord[]> {
    return this.request<HistoryRecord[]>('GET', `/history/week/${weekId}`);
  }

  // Unavailability
  async getUnavailability(): Promise<Unavailability[]> {
    const response = await this.request<UnavailabilityBackend[]>('GET', '/unavailability');
    
    // Map backend format to frontend format
    return response.map(item => ({
      id: item.id,
      caregiverId: item.caregiver_id,
      caregiverName: item.caregiver_name || '',
      startDate: item.start_date,
      endDate: item.end_date,
      reason: item.reason,
      isRecurring: item.is_recurring,
      recurringEndDate: item.recurring_end_date
    }));
  }

  async getCaregiverUnavailability(caregiverId: number): Promise<Unavailability[]> {
    const response = await this.request<UnavailabilityBackend[]>('GET', `/unavailability/caregiver/${caregiverId}`);
    
    // Map backend format to frontend format
    return response.map(item => ({
      id: item.id,
      caregiverId: item.caregiver_id,
      caregiverName: item.caregiver_name || '',
      startDate: item.start_date,
      endDate: item.end_date,
      reason: item.reason,
      isRecurring: item.is_recurring,
      recurringEndDate: item.recurring_end_date
    }));
  }

  async createUnavailability(unavailability: NewUnavailabilityData): Promise<Unavailability> {
    // Map frontend format to backend format
    const payload = {
      caregiver_id: unavailability.caregiverId,
      start_date: unavailability.startDate,
      end_date: unavailability.endDate,
      reason: unavailability.reason,
      is_recurring: unavailability.isRecurring,
      recurring_end_date: unavailability.recurringEndDate
    };
    
    const response = await this.request<UnavailabilityBackend>('POST', '/unavailability', { data: payload });
    
    // Map response back to frontend format
    return {
      id: response.id,
      caregiverId: response.caregiver_id,
      caregiverName: response.caregiver_name || '',
      startDate: response.start_date,
      endDate: response.end_date,
      reason: response.reason,
      isRecurring: response.is_recurring,
      recurringEndDate: response.recurring_end_date
    };
  }

  async updateUnavailability(id: number, unavailability: NewUnavailabilityData): Promise<Unavailability> {
    // Map frontend format to backend format
    const payload = {
      caregiver_id: unavailability.caregiverId,
      start_date: unavailability.startDate,
      end_date: unavailability.endDate,
      reason: unavailability.reason,
      is_recurring: unavailability.isRecurring,
      recurring_end_date: unavailability.recurringEndDate
    };
    
    const response = await this.request<UnavailabilityBackend>('PUT', `/unavailability/${id}`, { data: payload });
    
    // Map response back to frontend format
    return {
      id: response.id,
      caregiverId: response.caregiver_id,
      caregiverName: response.caregiver_name || '',
      startDate: response.start_date,
      endDate: response.end_date,
      reason: response.reason,
      isRecurring: response.is_recurring,
      recurringEndDate: response.recurring_end_date
    };
  }

  async deleteUnavailability(id: number): Promise<void> {
    return this.request<void>('DELETE', `/unavailability/${id}`);
  }
}

// Create and export a singleton instance
export const apiService = new APIService();
