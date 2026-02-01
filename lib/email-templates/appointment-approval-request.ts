// Appointment Approval Request Email Template (for doctors)

import { EMAIL_CONFIG } from "./config";
import { getEmailWrapper, getEmailHeader, getEmailFooter } from "./layout";

const { primaryColor, warningColor, textSecondary, bgLight, bgWarning } =
  EMAIL_CONFIG;

interface AppointmentApprovalRequestTemplateData {
  patientName: string;
  patientPhone: string;
  date: string;
  time: string;
  symptoms: string;
  clinicName: string;
}

/**
 * Generate appointment approval request email HTML for doctors
 *
 * Sent when a patient books an appointment that needs doctor approval
 */
export const getAppointmentApprovalRequestTemplate = ({
  patientName,
  patientPhone,
  date,
  time,
  symptoms,
  clinicName,
}: AppointmentApprovalRequestTemplateData): string => {
  return getEmailWrapper(`
    ${getEmailHeader("Action Required: New Appointment")}
    <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
      <h2 style="color: #1f2937; margin-top: 0;">New Appointment Request</h2>
      <p style="color: ${textSecondary};">A patient has requested an appointment that requires your approval.</p>

      <!-- Patient & Appointment Details -->
      <div style="background: ${bgLight}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${primaryColor};">
        <p style="margin: 8px 0;"><strong>Patient:</strong> ${patientName}</p>
        <p style="margin: 8px 0;"><strong>Phone:</strong> ${patientPhone}</p>
        <p style="margin: 8px 0;"><strong>Requested Date:</strong> ${date}</p>
        <p style="margin: 8px 0;"><strong>Requested Time:</strong> ${time} (IST)</p>
      </div>

      <!-- Symptoms Box -->
      <div style="background: ${bgWarning}; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${warningColor};">
        <p style="margin: 0;"><strong>Symptoms/Reason:</strong></p>
        <p style="margin: 8px 0 0 0; color: ${textSecondary};">${symptoms}</p>
      </div>

      <!-- Action Required Notice -->
      <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
        <p style="margin: 0; color: #991b1b;"><strong>Action Required:</strong></p>
        <p style="margin: 8px 0 0 0; color: #991b1b;">Please log in to your dashboard to approve or decline this appointment request.</p>
      </div>
    </div>
    ${getEmailFooter()}
  `);
};

export const getAppointmentApprovalRequestSubject = (
  clinicName: string,
): string => {
  return `Action Required: New Appointment Request - ${clinicName}`;
};
