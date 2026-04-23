import { EMAIL_CONFIG } from "./config";
import {
  getActionButton,
  getEmailFooter,
  getEmailHeader,
  getEmailWrapper,
} from "./layout";

const {
  clinicName,
  secondaryColor,
  textPrimary,
  textSecondary,
  textMuted,
  borderColor,
  bgLight,
  primaryColor,
} = EMAIL_CONFIG;

interface DoctorVerificationRequestTemplateData {
  doctorName: string;
  doctorEmail: string;
  doctorPhone: string;
  speciality: string;
  registrationNumber: string;
  reviewUrl: string;
}

export const getDoctorVerificationRequestTemplate = ({
  doctorName,
  doctorEmail,
  doctorPhone,
  speciality,
  registrationNumber,
  reviewUrl,
}: DoctorVerificationRequestTemplateData): string =>
  getEmailWrapper(`
    ${getEmailHeader("Doctor Approval Request")}
    <div style="background: #ffffff; padding: 30px; border: 1px solid ${borderColor}; border-top: none; border-radius: 0 0 10px 10px;">
      <h2 style="color: ${textPrimary}; margin-top: 0;">A new doctor profile is waiting for review</h2>
      <p style="color: ${textSecondary};">
        A doctor has completed registration and is now pending admin approval in <strong>${clinicName}</strong>.
      </p>

      <div style="background: ${bgLight}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${primaryColor};">
        <p style="margin: 8px 0;"><strong>Name:</strong> ${doctorName}</p>
        <p style="margin: 8px 0;"><strong>Email:</strong> ${doctorEmail}</p>
        <p style="margin: 8px 0;"><strong>Phone:</strong> ${doctorPhone}</p>
        <p style="margin: 8px 0;"><strong>Speciality:</strong> ${speciality}</p>
        <p style="margin: 8px 0;"><strong>Registration Number:</strong> ${registrationNumber}</p>
      </div>

      <p style="color: ${textMuted}; margin-bottom: 24px;">
        Review the submitted certificate, Aadhaar card, PAN card, and doctor details from the admin dashboard.
      </p>

      ${getActionButton("Open Admin Review", reviewUrl, secondaryColor)}
    </div>
    ${getEmailFooter()}
  `);

export const getDoctorVerificationRequestSubject = () =>
  `Doctor approval request pending - ${clinicName}`;
