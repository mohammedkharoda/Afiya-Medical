// Email Verification Template

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

interface VerificationTemplateData {
  url: string;
}

/**
 * Generate email verification email HTML
 *
 * Customize:
 * - Change button text and styling
 * - Modify the welcome message
 * - Adjust expiry time (default: 24 hours)
 */
export const getVerificationEmailTemplate = ({
  url,
}: VerificationTemplateData): string => {
  return getEmailWrapper(`
    ${getEmailHeader("Verify Your Email")}
    <div style="background: #ffffff; padding: 30px; border: 1px solid ${borderColor}; border-top: none; border-radius: 0 0 10px 10px;">
      <h2 style="color: ${textPrimary}; margin-top: 0;">Welcome to ${clinicName}!</h2>
      <p style="color: ${textSecondary};">Thank you for registering! Please click the button below to verify your email address and activate your account.</p>
      
      <!-- Verify Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${url}" style="background: ${secondaryColor}; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Email</a>
      </div>
      
      <p style="color: ${textMuted}; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="color: ${secondaryColor}; word-break: break-all; font-size: 14px;">${url}</p>
      
      <hr style="border: none; border-top: 1px solid ${borderColor}; margin: 30px 0;">
      
      <p style="color: ${textLight}; font-size: 12px; text-align: center;">
        This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
      </p>
    </div>
    ${getEmailFooter()}
  `);
};

export const getVerificationEmailSubject = (): string => {
  return `Verify your email - ${clinicName}`;
};
