export interface Invitation {
  id: string;
  email: string;
  name: string | null;
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
  expiresAt: string;
  createdAt: string;
  acceptedAt: string | null;
  isTestAccount: boolean;
}

export interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
  speciality: string;
  degrees: string[];
  experience: number | null;
  isTestAccount: boolean;
  isVerified: boolean;
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED" | null;
  verificationReviewedAt: string | null;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  registrationNumber: string;
  registrationCertificateUrl: string;
  registrationCertificateName: string;
  aadhaarCardUrl: string;
  aadhaarCardName: string;
  panCardUrl: string;
  panCardName: string;
  reviewNotes: string | null;
  reviewedAt: string | null;
  submittedAt: string;
  createdAt: string;
  doctorName: string;
  doctorEmail: string;
  doctorPhone: string | null;
  doctorIsActive: boolean;
  speciality: string;
  degrees: string[];
  experience: number | null;
  clinicAddress: string | null;
  isTestAccount: boolean;
}

export interface VerificationSummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}
