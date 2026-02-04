// Appointment Confirmation Email Template (for patients)

import { EMAIL_CONFIG } from "./config";
import { getEmailWrapper, getEmailHeader, getEmailFooter } from "./layout";

const {
  primaryColor,
  warningColor,
  textPrimary,
  textSecondary,
  textMuted,
  bgLight,
  bgWarning,
} = EMAIL_CONFIG;

interface AppointmentConfirmationTemplateData {
  patientName: string;
  date: string;
  time: string;
  doctorName: string;
  clinicName: string;
  clinicAddress?: string;
}

/**
 * Generate appointment confirmation email HTML for patients
 *
 * Customize:
 * - Change the appointment details layout
 * - Modify the reminder message
 * - Add clinic address/directions
 * - Include preparation instructions
 */
export const getAppointmentConfirmationTemplate = ({
  patientName,
  date,
  time,
  doctorName,
  clinicName,
  clinicAddress,
}: AppointmentConfirmationTemplateData): string => {
  return getEmailWrapper(`
    ${getEmailHeader("Appointment Confirmed")}
    <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
      <h2 style="color: ${textPrimary}; margin-top: 0;">Your Appointment is Confirmed!</h2>
      <p style="color: ${textSecondary};">Dear ${patientName},</p>
      <p style="color: ${textSecondary};">Your appointment has been successfully scheduled.</p>
      
      <!-- Appointment Details Box -->
      <div style="background: ${bgLight}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${primaryColor};">
        <p style="margin: 8px 0;"><strong>Date:</strong> ${date}</p>
        <p style="margin: 8px 0;"><strong>Time:</strong> ${time} (IST)</p>
        <p style="margin: 8px 0;"><strong>Doctor:</strong> ${doctorName}</p>
        <p style="margin: 8px 0;"><strong>Location:</strong> ${clinicAddress || clinicName}</p>
      </div>
      
      <!-- Reminder Box -->
      <div style="background: ${bgWarning}; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${warningColor};">
        <p style="margin: 0; color: #92400e;"><strong>Reminder:</strong> Please arrive 10 minutes before your scheduled time.</p>
      </div>
      
      <p style="color: ${textMuted}; font-size: 14px;">If you need to cancel or reschedule, please do so at least 24 hours in advance.</p>
    </div>
    ${getEmailFooter({ address: clinicAddress })}
  `);
};

export const getAppointmentConfirmationSubject = (
  clinicName: string,
): string => {
  return `Appointment Confirmed - ${clinicName}`;
};
