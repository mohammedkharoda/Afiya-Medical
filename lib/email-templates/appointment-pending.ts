// Appointment Pending Email Template (for patients when they book)

import { EMAIL_CONFIG } from "./config";
import { getEmailWrapper, getEmailHeader, getEmailFooter } from "./layout";

const {
  primaryColor,
  warningColor,
  textPrimary,
  textSecondary,
  bgLight,
  bgWarning,
} = EMAIL_CONFIG;

interface AppointmentPendingTemplateData {
  patientName: string;
  date: string;
  time: string;
  doctorName: string;
  clinicName: string;
  clinicAddress?: string;
}

/**
 * Generate appointment pending approval email HTML for patients
 *
 * Sent when patient books an appointment (before doctor approval)
 */
export const getAppointmentPendingTemplate = ({
  patientName,
  date,
  time,
  doctorName,
  clinicName,
  clinicAddress,
}: AppointmentPendingTemplateData): string => {
  return getEmailWrapper(`
    ${getEmailHeader("Appointment Request Received")}
    <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
      <h2 style="color: ${textPrimary}; margin-top: 0;">Your Appointment Request is Pending</h2>
      <p style="color: ${textSecondary};">Dear ${patientName},</p>
      <p style="color: ${textSecondary};">Your appointment request has been submitted and is awaiting doctor approval.</p>

      <!-- Appointment Details Box -->
      <div style="background: ${bgLight}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${primaryColor};">
        <p style="margin: 8px 0;"><strong>Requested Date:</strong> ${date}</p>
        <p style="margin: 8px 0;"><strong>Requested Time:</strong> ${time} (IST)</p>
        <p style="margin: 8px 0;"><strong>Doctor:</strong> ${doctorName}</p>
        <p style="margin: 8px 0;"><strong>Location:</strong> ${clinicAddress || clinicName}</p>
      </div>

      <!-- Pending Notice -->
      <div style="background: ${bgWarning}; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${warningColor};">
        <p style="margin: 0; color: #92400e;"><strong>What's Next?</strong></p>
        <p style="margin: 8px 0 0 0; color: #92400e;">The doctor will review your request and confirm your appointment. You will receive another email once your appointment is confirmed or if any changes are needed.</p>
      </div>

      <p style="color: ${textSecondary}; font-size: 14px;">Thank you for choosing ${clinicName}!</p>
    </div>
    ${getEmailFooter({ address: clinicAddress })}
  `);
};

export const getAppointmentPendingSubject = (clinicName: string): string => {
  return `Appointment Request Received - ${clinicName}`;
};
