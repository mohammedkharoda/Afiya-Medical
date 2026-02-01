// Appointment Cancelled by Patient Email Template (for doctors)

import { EMAIL_CONFIG } from "./config";
import { getEmailWrapper, getEmailHeader, getEmailFooter } from "./layout";

const { primaryColor, errorColor, textSecondary, bgLight } = EMAIL_CONFIG;

interface AppointmentCancelledByPatientTemplateData {
  patientName: string;
  patientPhone: string;
  date: string;
  time: string;
  reason: string;
}

/**
 * Generate appointment cancelled by patient email HTML for doctors
 *
 * Sent when a patient cancels their confirmed appointment
 */
export const getAppointmentCancelledByPatientTemplate = ({
  patientName,
  patientPhone,
  date,
  time,
  reason,
}: AppointmentCancelledByPatientTemplateData): string => {
  return getEmailWrapper(`
    ${getEmailHeader("Patient Cancelled Appointment")}
    <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
      <!-- Cancellation Banner -->
      <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid ${errorColor};">
        <p style="margin: 0; color: #991b1b; font-size: 16px;"><strong>Appointment Cancelled</strong></p>
        <p style="margin: 8px 0 0 0; color: #991b1b;">A patient has cancelled their scheduled appointment.</p>
      </div>

      <!-- Patient & Appointment Details -->
      <div style="background: ${bgLight}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${primaryColor};">
        <p style="margin: 8px 0;"><strong>Patient:</strong> ${patientName}</p>
        <p style="margin: 8px 0;"><strong>Phone:</strong> ${patientPhone}</p>
        <p style="margin: 8px 0;"><strong>Original Date:</strong> ${date}</p>
        <p style="margin: 8px 0;"><strong>Original Time:</strong> ${time} (IST)</p>
      </div>

      <!-- Cancellation Reason Box -->
      <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${errorColor};">
        <p style="margin: 0; color: #991b1b;"><strong>Cancellation Reason:</strong></p>
        <p style="margin: 8px 0 0 0; color: ${textSecondary};">${reason}</p>
      </div>

      <p style="color: ${textSecondary}; font-size: 14px;">This time slot is now available for other patients.</p>
    </div>
    ${getEmailFooter()}
  `);
};

export const getAppointmentCancelledByPatientSubject = (
  clinicName: string,
): string => {
  return `Patient Cancelled Appointment - ${clinicName}`;
};
