// Appointment Approved Email Template (for patients)

import { EMAIL_CONFIG } from "./config";
import { getEmailWrapper, getEmailHeader, getEmailFooter } from "./layout";

const {
  primaryColor,
  successColor,
  warningColor,
  textPrimary,
  textSecondary,
  textMuted,
  bgLight,
  bgSuccess,
  bgWarning,
} = EMAIL_CONFIG;

interface AppointmentApprovedTemplateData {
  patientName: string;
  date: string;
  time: string;
  doctorName: string;
  clinicName: string;
}

/**
 * Generate appointment approved email HTML for patients
 *
 * Sent when doctor approves a pending appointment
 */
export const getAppointmentApprovedTemplate = ({
  patientName,
  date,
  time,
  doctorName,
  clinicName,
}: AppointmentApprovedTemplateData): string => {
  return getEmailWrapper(`
    ${getEmailHeader("Appointment Confirmed")}
    <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
      <!-- Success Banner -->
      <div style="background: ${bgSuccess}; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid ${successColor};">
        <p style="margin: 0; color: #065f46; font-size: 16px;"><strong>Great News!</strong> Your appointment has been confirmed by the doctor.</p>
      </div>

      <p style="color: ${textSecondary};">Dear ${patientName},</p>
      <p style="color: ${textSecondary};">Your appointment request has been approved and is now confirmed.</p>

      <!-- Appointment Details Box -->
      <div style="background: ${bgLight}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${primaryColor};">
        <p style="margin: 8px 0;"><strong>Date:</strong> ${date}</p>
        <p style="margin: 8px 0;"><strong>Time:</strong> ${time} (IST)</p>
        <p style="margin: 8px 0;"><strong>Doctor:</strong> ${doctorName}</p>
        <p style="margin: 8px 0;"><strong>Location:</strong> ${clinicName}</p>
      </div>

      <!-- Reminder Box -->
      <div style="background: ${bgWarning}; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${warningColor};">
        <p style="margin: 0; color: #92400e;"><strong>Reminder:</strong> Please arrive 10 minutes before your scheduled time.</p>
      </div>

      <p style="color: ${textMuted}; font-size: 14px;">If you need to cancel your appointment, please do so at least 24 hours in advance through your patient portal.</p>
    </div>
    ${getEmailFooter()}
  `);
};

export const getAppointmentApprovedSubject = (clinicName: string): string => {
  return `Appointment Confirmed - ${clinicName}`;
};
