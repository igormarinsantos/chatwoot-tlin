export interface Clinic {
  id: string;
  name: string;
  timezone: string;
  created_at: Date;
  updated_at: Date;
}

export interface Professional {
  id: string;
  clinic_id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface Procedure {
  id: string;
  clinic_id: string;
  name: string;
  duration_minutes: number;
  created_at: Date;
  updated_at: Date;
}

export interface AvailabilityRule {
  id: string;
  professional_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  created_at: Date;
  updated_at: Date;
}

export interface Block {
  id: string;
  professional_id: string;
  start_datetime: Date;
  end_datetime: Date;
  reason?: string;
  created_at: Date;
  updated_at: Date;
}

export type AppointmentStatus = "HOLD" | "CONFIRMED" | "CANCELLED" | "NO_SHOW";

export interface Appointment {
  id: string;
  clinic_id: string;
  professional_id: string;
  procedure_id: string;
  patient_name: string;
  patient_phone: string;
  start_datetime: Date;
  end_datetime: Date;
  status: AppointmentStatus;
  metadata: any;
  created_at: Date;
  updated_at: Date;
}

export interface WebhookSubscription {
  id: string;
  clinic_id: string;
  url: string;
  secret: string;
  event_types: string[];
  created_at: Date;
  updated_at: Date;
}
