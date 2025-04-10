export interface UnavailabilityBackend {
  id: number;
  caregiver_id: number;
  caregiver_name?: string;
  start_date: string;
  end_date: string;
  reason?: string;
  is_recurring: boolean;
  recurring_end_date?: string;
}

export interface Unavailability {
  id: number;
  caregiverId: number;
  caregiverName: string;
  startDate: string;
  endDate: string;
  reason?: string;
  isRecurring: boolean;
  recurringEndDate?: string;
}

export interface NewUnavailabilityData {
  caregiverId: number;
  startDate: string;
  endDate: string;
  reason?: string;
  isRecurring: boolean;
  recurringEndDate?: string;
}
