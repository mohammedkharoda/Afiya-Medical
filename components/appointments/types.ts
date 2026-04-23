export interface Appointment {
  remainingPaymentScreenshot: string | null | undefined;
  id: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  symptoms?: string;
  notes?: string;
  originalAppointmentDate?: string;
  originalAppointmentTime?: string;
  rescheduledAt?: string;
  // Video consultation fields
  isVideoConsultation?: boolean;
  videoConsultationFee?: number | null;
  depositAmount?: number | null;
  depositPaid?: boolean;
  depositConfirmedAt?: string | null;
  depositVerifiedAt?: string | null;
  depositPaymentScreenshot?: string | null;
  videoMeetingUrl?: string | null;
  videoMeetingId?: string | null;
  videoMeetingPassword?: string | null;
  remainingAmount?: number | null;
  remainingPaid?: boolean;
  remainingConfirmedAt?: string | null;
  remainingVerifiedAt?: string | null;
  prescriptionWithheld?: boolean;
  doctorId?: string;
  doctorName?: string | null;
  doctorPublicId?: string | null;
  doctorUpiId?: string | null;
  doctorUpiQrCode?: string | null;
  patient?: {
    id?: string;
    publicId?: string;
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
  patientPublicId?: string | null;
  doctorPublicId?: string | null;
}

export interface DoctorProfile {
  publicId: string;
  speciality: string;
  degrees: string[];
  experience: number | null;
  upiId: string;
  upiQrCode?: string | null;
  clinicAddress: string | null;
}
