import axios, { AxiosInstance } from 'axios';
import { Caregiver, Shift, Notification, WeeklySchedule } from '../types';

class ApiService {
  private api: AxiosInstance;
  
  constructor() {
    this.api = axios.create({
      baseURL: 'http://localhost:3000/api',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // Team members APIs
  async getTeamMembers(): Promise<Caregiver[]> {
    const response = await this.api.get('/team');
    return response.data;
  }

  async getTeamMember(id: number): Promise<Caregiver> {
    const response = await this.api.get(`/team/${id}`);
    return response.data;
  }

  async createTeamMember(caregiver: Omit<Caregiver, 'id'>): Promise<Caregiver> {
    const response = await this.api.post('/team', caregiver);
    return response.data;
  }

  async updateTeamMember(caregiver: Caregiver): Promise<Caregiver> {
    const response = await this.api.put(`/team/${caregiver.id}`, caregiver);
    return response.data;
  }

  async deleteTeamMember(id: number): Promise<void> {
    await this.api.delete(`/team/${id}`);
  }

  // Week APIs
  async getAllWeeks() {
    const response = await this.api.get('/schedule/weeks');
    return response.data;
  }

  async getCurrentWeek() {
    const response = await this.api.get('/schedule/weeks/current');
    return response.data;
  }

  // Schedule APIs
  async getScheduleForWeek(weekId: number): Promise<WeeklySchedule> {
    const response = await this.api.get(`/schedule/weeks/${weekId}/shifts`);
    return response.data;
  }

  async getShift(id: number): Promise<Shift> {
    const response = await this.api.get(`/schedule/shifts/${id}`);
    return response.data;
  }

  async createShift(shift: Omit<Shift, 'id'>): Promise<Shift> {
    const response = await this.api.post('/schedule/shifts', shift);
    return response.data;
  }

  async updateShift(shift: Shift): Promise<Shift> {
    const response = await this.api.put(`/schedule/shifts/${shift.id}`, shift);
    return response.data;
  }

  async deleteShift(id: number): Promise<void> {
    await this.api.delete(`/schedule/shifts/${id}`);
  }

  async dropShift(id: number, reason?: string): Promise<Shift> {
    const response = await this.api.post(`/schedule/shifts/${id}/drop`, { reason });
    return response.data;
  }

  async swapShift(id: number, swapWithId: number): Promise<{ original_shift: Shift, swap_with_shift: Shift }> {
    const response = await this.api.post(`/schedule/shifts/${id}/swap`, { swap_with_id: swapWithId });
    return response.data;
  }

  async adjustShift(id: number, newStartTime?: string, newEndTime?: string, reason?: string): Promise<Shift> {
    const response = await this.api.post(`/schedule/shifts/${id}/adjust`, { 
      new_start_time: newStartTime,
      new_end_time: newEndTime,
      reason
    });
    return response.data;
  }

  // Notification APIs
  async getAllNotifications(): Promise<Notification[]> {
    const response = await this.api.get('/notifications');
    return response.data;
  }

  async getNotificationsByStatus(status: 'pending' | 'completed'): Promise<Notification[]> {
    const response = await this.api.get(`/notifications/status/${status}`);
    return response.data;
  }

  async approveNotification(id: number, caregiverId?: number): Promise<{ original: Notification, confirmation: Notification }> {
    const response = await this.api.put(`/notifications/${id}/approve`, { action_by_caregiver_id: caregiverId });
    return response.data;
  }

  // Payroll APIs
  async getPayrollRecordsByWeek(weekId: number) {
    const response = await this.api.get(`/payroll/week/${weekId}`);
    return response.data;
  }

  async calculatePayrollForWeek(weekId: number, notes?: string) {
    const response = await this.api.post(`/payroll/calculate/${weekId}`, { notes });
    return response.data;
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();