// Password Reset Email Template

import { EMAIL_CONFIG } from "./config";
import { getEmailWrapper, getEmailHeader, getEmailFooter } from "./layout";

const {
  clinicName,
  primaryColor,
  secondaryColor,
  textPrimary,
  textSecondary,
  textMuted,
  textLight,
  borderColor,
} = EMAIL_CONFIG;

interface PasswordResetTemplateData {
  url: string;
}

/**
 * Generate password reset email HTML
 *
 * Customize:
 * - Change button text and styling
 * - Modify the security message
 * - Adjust expiry time (default: 1 hour)
 */
export const getPasswordResetEmailTemplate = ({
  url,
}: PasswordResetTemplateData): string => {
  return getEmailWrapper(`
    ${getEmailHeader("Reset Your Password")}
    <div style="background: #ffffff; padding: 30px; border: 1px solid ${borderColor}; border-top: none; border-radius: 0 0 10px 10px;">
      <h2 style="color: ${textPrimary}; margin-top: 0;">Password Reset Request</h2>
      <p style="color: ${textSecondary};">We received a request to reset your password. Click the button below to create a new password.</p>
      
      <!-- Reset Password Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${url}" style="background: ${secondaryColor}; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      
      <p style="color: ${textMuted}; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="color: ${secondaryColor}; word-break: break-all; font-size: 14px;">${url}</p>
      
      <hr style="border: none; border-top: 1px solid ${borderColor}; margin: 30px 0;">
      
      <p style="color: ${textLight}; font-size: 12px; text-align: center;">
        This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
      </p>
    </div>
    ${getEmailFooter()}
  `);
};

export const getPasswordResetEmailSubject = (): string => {
  return `Reset your password - ${clinicName}`;
};
