/** Shared domain types used across dashboard pages and API responses. */

export interface AppointmentUser {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface AppointmentPatient {
  userId?: string;
  publicId?: string;
  address?: string;
  user?: AppointmentUser;
}

export interface AppointmentPrescription {
  id?: string;
  followUpDate?: string | null;
}

export interface Appointment {
  id: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  paymentStatus?: string;
  symptoms?: string;
  notes?: string;
  isVideoConsultation?: boolean;
  depositPaid?: boolean;
  depositConfirmedAt?: string | null;
  remainingPaid?: boolean;
  remainingConfirmedAt?: string | null;
  prescriptionWithheld?: boolean;
  doctorId?: string | null;
  patient?: AppointmentPatient;
  prescription?: AppointmentPrescription;
}

export interface Payment {
  id: string;
  amount: number;
  status: string;
  paymentMethod: string;
  paidAt: string | null;
  createdAt: string;
  appointment?: Appointment;
}
