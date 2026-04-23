// Appointment Status Update Email Template

import { EMAIL_CONFIG } from "./config";
import {
  getEmailBrandBlock,
  getEmailFooter,
  getEmailWrapper,
} from "./layout";
import { getReferenceBlock } from "./reference";

const {
  clinicName,
  primaryColor,
  successColor,
  errorColor,
  warningColor,
  textSecondary,
  bgLight,
  bgSuccess,
} = EMAIL_CONFIG;

interface AppointmentStatusTemplateData {
  patientName: string;
  status: "COMPLETED" | "CANCELLED" | "RESCHEDULED" | string;
  date: string;
  time: string;
  doctorPublicId?: string;
  patientPublicId?: string;
  clinicAddress?: string;
}

interface StatusConfig {
  subject: string;
  message: string;
  color: string;
}

/**
 * Get status-specific configuration
 * Customize the messages and colors for each status
 */
const getStatusConfig = (status: string, clinicName: string): StatusConfig => {
  switch (status) {
    case "COMPLETED":
      return {
        subject: `Visit Completed - ${clinicName}`,
        message:
          "Your appointment has been marked as completed. Thank you for visiting us!",
        color: successColor,
      };
    case "CANCELLED":
      return {
        subject: `Appointment Cancelled - ${clinicName}`,
        message:
          "Your appointment has been cancelled. Please book a new appointment if needed.",
        color: errorColor,
      };
    case "RESCHEDULED":
      return {
        subject: `Appointment Rescheduled - ${clinicName}`,
        message:
          "Your appointment has been rescheduled. Please check the new details below.",
        color: warningColor,
      };
    default:
      return {
        subject: `Appointment Update - ${clinicName}`,
        message: `Your appointment status has been updated to ${status}.`,
        color: primaryColor,
      };
  }
};

/**
 * Generate appointment status update email HTML
 *
 * Customize:
 * - Change status-specific messages in getStatusConfig
 * - Modify the layout for each status type
 * - Add action buttons for rebooking
 */
export const getAppointmentStatusTemplate = ({
  patientName,
  status,
  date,
  time,
  doctorPublicId,
  patientPublicId,
  clinicAddress,
}: AppointmentStatusTemplateData): string => {
  const config = getStatusConfig(status, clinicName);
  const statusFormatted = status.charAt(0) + status.slice(1).toLowerCase();

  return getEmailWrapper(`
    <!-- Custom Header with Status Color -->
    <div style="background: linear-gradient(135deg, ${config.color} 0%, ${config.color}dd 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
      ${getEmailBrandBlock({
        brandColor: "#ffffff",
        subtitleColor: "rgba(255, 255, 255, 0.82)",
      })}
      <h1 style="color: white; margin: 0; font-size: 24px;">Appointment ${statusFormatted}</h1>
    </div>
    
    <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
      <p style="color: ${textSecondary};">Dear ${patientName},</p>
      <p style="color: ${textSecondary};">${config.message}</p>
      
      <!-- Appointment Details -->
      <div style="background: ${bgLight}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${config.color};">
        <p style="margin: 8px 0;"><strong>Date:</strong> ${date}</p>
        <p style="margin: 8px 0;"><strong>Time:</strong> ${time} (IST)</p>
      </div>
      
      ${
        status === "COMPLETED"
          ? `
      <!-- Prescription Note (only for completed) -->
      <div style="background: ${bgSuccess}; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #065f46;"><strong>Note:</strong> Your prescription will be available in your patient portal soon.</p>
      </div>
      `
          : ""
      }
      ${getReferenceBlock({ doctorPublicId, patientPublicId })}
    </div>
    ${getEmailFooter({ address: clinicAddress })}
  `);
};

export const getAppointmentStatusSubject = (status: string): string => {
  return getStatusConfig(status, clinicName).subject;
};
