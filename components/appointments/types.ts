export interface Appointment {
  id: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  symptoms?: string;
  notes?: string;
  originalAppointmentDate?: string;
  originalAppointmentTime?: string;
  rescheduledAt?: string;
  patient?: {
    id?: string;
    address?: string;
    user?: {
      name?: string;
      email?: string;
      phone?: string;
    };
    medicalDocuments?: {
      id: string;
      fileUrl: string;
      fileName: string;
      documentType: string;
      createdAt: string;
    }[];
  };
  prescription?: {
    diagnosis: string;
    notes?: string;
    followUpDate?: string | null;
    medications: Medication[];
  };
  payment?: {
    id: string;
    amount: number;
    status: string;
    paymentMethod: string;
    paidAt?: string;
    notes?: string;
    paymentScreenshot?: string;
    createdAt: string;
  };
}

export interface Medication {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export type UserRole = "PATIENT" | "DOCTOR" | "ADMIN";

export interface UserData {
  id: string;
  email: string;
  name: string;
  role?: UserRole;
}

export interface DoctorProfile {
  speciality: string;
  degrees: string[];
  experience: number | null;
  upiId: string;
  clinicAddress: string | null;
}
