// New Appointment Alert Email Template (for doctors)

import { EMAIL_CONFIG } from "./config";
import { getEmailWrapper, getEmailHeader, getEmailFooter } from "./layout";

const { primaryColor, warningColor, textSecondary, bgLight, bgWarning } =
  EMAIL_CONFIG;

interface NewAppointmentAlertTemplateData {
  patientName: string;
  patientPhone: string;
  date: string;
  time: string;
  symptoms: string;
  clinicAddress?: string;
}

/**
 * Generate new appointment alert email HTML for doctors
 *
 * Customize:
 * - Add patient history summary
 * - Include quick action buttons
 * - Add patient contact options
 */
export const getNewAppointmentAlertTemplate = ({
  patientName,
  patientPhone,
  date,
  time,
  symptoms,
  clinicAddress,
}: NewAppointmentAlertTemplateData): string => {
  return getEmailWrapper(`
    ${getEmailHeader("New Appointment")}
    <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
      <h2 style="color: #1f2937; margin-top: 0;">New Patient Booking</h2>
      <p style="color: ${textSecondary};">You have a new appointment request.</p>
      
      <!-- Patient & Appointment Details -->
      <div style="background: ${bgLight}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${primaryColor};">
        <p style="margin: 8px 0;"><strong>Patient:</strong> ${patientName}</p>
        <p style="margin: 8px 0;"><strong>Phone:</strong> ${patientPhone}</p>
        <p style="margin: 8px 0;"><strong>Date:</strong> ${date}</p>
        <p style="margin: 8px 0;"><strong>Time:</strong> ${time} (IST)</p>
      </div>
      
      <!-- Symptoms Box -->
      <div style="background: ${bgWarning}; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${warningColor};">
        <p style="margin: 0;"><strong>Symptoms/Reason:</strong></p>
        <p style="margin: 8px 0 0 0; color: ${textSecondary};">${symptoms}</p>
      </div>
    </div>
    ${getEmailFooter({ address: clinicAddress })}
  `);
};

export const getNewAppointmentAlertSubject = (clinicName: string): string => {
  return `New Appointment Booking - ${clinicName}`;
};
