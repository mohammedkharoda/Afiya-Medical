// Appointment Reminder Email Template

import { EMAIL_CONFIG } from "./config";
import { getEmailWrapper, getEmailHeader, getEmailFooter } from "./layout";

const { primaryColor, infoColor, textPrimary, textSecondary, bgLight, bgInfo } =
  EMAIL_CONFIG;

interface AppointmentReminderTemplateData {
  patientName: string;
  date: string;
  time: string;
  doctorName: string;
  clinicName: string;
  clinicAddress?: string;
}

/**
 * Generate appointment reminder email HTML (30 minutes before)
 *
 * Customize:
 * - Change the reminder timing in the title
 * - Add directions/maps link
 * - Include preparation checklist
 */
export const getAppointmentReminderTemplate = ({
  patientName,
  date,
  time,
  doctorName,
  clinicName,
  clinicAddress,
}: AppointmentReminderTemplateData): string => {
  return getEmailWrapper(`
    ${getEmailHeader("Appointment Reminder")}
    <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
      <!-- Clock Icon -->
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="font-size: 48px;">⏰</span>
      </div>
      
      <h2 style="color: ${textPrimary}; margin-top: 0; text-align: center;">Your Appointment is in 30 Minutes!</h2>
      <p style="color: ${textSecondary};">Dear ${patientName},</p>
      <p style="color: ${textSecondary};">This is a friendly reminder that your appointment is coming up soon.</p>
      
      <!-- Appointment Details -->
      <div style="background: ${bgLight}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${primaryColor};">
        <p style="margin: 8px 0;"><strong>Date:</strong> ${date}</p>
        <p style="margin: 8px 0;"><strong>Time:</strong> ${time} (IST)</p>
        <p style="margin: 8px 0;"><strong>Doctor:</strong> ${doctorName}</p>
        <p style="margin: 8px 0;"><strong>Location:</strong> ${clinicAddress || clinicName}</p>
      </div>
      
      <!-- Tip Box -->
      <div style="background: ${bgInfo}; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${infoColor};">
        <p style="margin: 0; color: #1e40af;"><strong>Tip:</strong> Please ensure you arrive on time. Bring any relevant medical documents or reports.</p>
      </div>
    </div>
    ${getEmailFooter({ address: clinicAddress })}
  `);
};

export const getAppointmentReminderSubject = (clinicName: string): string => {
  return `Reminder: Your appointment is in 30 minutes - ${clinicName}`;
};
