// Doctor Invitation Email Template

import { EMAIL_CONFIG } from "./config";
import {
  getEmailWrapper,
  getEmailHeader,
  getEmailFooter,
  getActionButton,
} from "./layout";

const {
  clinicName,
  secondaryColor,
  textPrimary,
  textSecondary,
  textMuted,
  textLight,
  borderColor,
} = EMAIL_CONFIG;

interface DoctorInvitationTemplateData {
  doctorName?: string;
  signupUrl: string;
  expiresInDays: number;
}

/**
 * Generate doctor invitation email HTML
 */
export const getDoctorInvitationTemplate = ({
  doctorName,
  signupUrl,
  expiresInDays,
}: DoctorInvitationTemplateData): string => {
  const greeting = doctorName ? `Dear Dr. ${doctorName}` : "Dear Doctor";

  return getEmailWrapper(`
    ${getEmailHeader("You're Invited!")}
    <div style="background: #ffffff; padding: 30px; border: 1px solid ${borderColor}; border-top: none; border-radius: 0 0 10px 10px;">
      <h2 style="color: ${textPrimary}; margin-top: 0;">${greeting},</h2>
      <p style="color: ${textSecondary};">You have been invited to join <strong>${clinicName}</strong> as a Doctor.</p>

      <p style="color: ${textSecondary};">Click the button below to complete your registration and set up your account:</p>

      ${getActionButton("Complete Registration", signupUrl, secondaryColor)}

      <p style="color: ${textMuted}; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="color: ${secondaryColor}; word-break: break-all; font-size: 14px;">${signupUrl}</p>

      <hr style="border: none; border-top: 1px solid ${borderColor}; margin: 30px 0;">

      <p style="color: ${textLight}; font-size: 12px; text-align: center;">
        This invitation link will expire in ${expiresInDays} days. If you did not expect this invitation, you can safely ignore this email.
      </p>
    </div>
    ${getEmailFooter()}
  `);
};

export const getDoctorInvitationSubject = (): string => {
  return `You're invited to join ${clinicName} as a Doctor`;
};
