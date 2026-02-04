// Appointment Declined Email Template (for patients)

import { EMAIL_CONFIG } from "./config";
import { getEmailWrapper, getEmailHeader, getEmailFooter } from "./layout";

const { primaryColor, errorColor, textPrimary, textSecondary, bgLight } =
  EMAIL_CONFIG;

interface AppointmentDeclinedTemplateData {
  patientName: string;
  date: string;
  time: string;
  reason?: string;
  clinicName: string;
  clinicAddress?: string;
}

/**
 * Generate appointment declined email HTML for patients
 *
 * Sent when doctor declines a pending appointment
 */
export const getAppointmentDeclinedTemplate = ({
  patientName,
  date,
  time,
  reason,
  clinicName,
  clinicAddress,
}: AppointmentDeclinedTemplateData): string => {
  const reasonSection = reason
    ? `
      <!-- Decline Reason Box -->
      <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${errorColor};">
        <p style="margin: 0; color: #991b1b;"><strong>Reason:</strong></p>
        <p style="margin: 8px 0 0 0; color: #991b1b;">${reason}</p>
      </div>
    `
    : "";

  return getEmailWrapper(`
    ${getEmailHeader("Appointment Request Declined")}
    <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
      <!-- Declined Banner -->
      <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid ${errorColor};">
        <p style="margin: 0; color: #991b1b; font-size: 16px;"><strong>Appointment Request Declined</strong></p>
      </div>

      <p style="color: ${textSecondary};">Dear ${patientName},</p>
      <p style="color: ${textSecondary};">Unfortunately, your appointment request could not be approved at this time.</p>

      <!-- Original Request Details -->
      <div style="background: ${bgLight}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${primaryColor};">
        <p style="margin: 8px 0;"><strong>Requested Date:</strong> ${date}</p>
        <p style="margin: 8px 0;"><strong>Requested Time:</strong> ${time} (IST)</p>
      </div>

      ${reasonSection}

      <!-- Next Steps -->
      <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
        <p style="margin: 0; color: #1e40af;"><strong>What can you do?</strong></p>
        <p style="margin: 8px 0 0 0; color: #1e40af;">Please try booking a different time slot that works for both you and the doctor. You can do this through your patient portal.</p>
      </div>

      <p style="color: ${textSecondary}; font-size: 14px;">We apologize for any inconvenience. Thank you for your understanding.</p>
    </div>
    ${getEmailFooter({ address: clinicAddress })}
  `);
};

export const getAppointmentDeclinedSubject = (clinicName: string): string => {
  return `Appointment Request Declined - ${clinicName}`;
};
