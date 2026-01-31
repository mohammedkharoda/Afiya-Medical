// Welcome / Signup Notification Email Template

import { EMAIL_CONFIG } from "./config";
import {
  getEmailWrapper,
  getEmailHeader,
  getEmailFooter,
  getActionButton,
} from "./layout";

const {
  clinicName,
  primaryColor,
  secondaryColor,
  textPrimary,
  textSecondary,
  textMuted,
} = EMAIL_CONFIG;

/**
 * Generate welcome email HTML
 *
 * Customize:
 * - Change the welcome message
 * - Add additional onboarding steps
 * - Include helpful links
 */
export const getWelcomeEmailTemplate = (p0: { phone: string }): string => {
  return getEmailWrapper(`
    ${getEmailHeader("Welcome!")}
    <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
      <h2 style="color: ${textPrimary}; margin-top: 0;">Welcome to ${clinicName}</h2>
      <p style="color: ${textSecondary};">Your account has been created and verified successfully.</p>
      <p style="color: ${textSecondary};">Please sign in to complete your profile by filling out your medical information. This helps us provide you with better care.</p>
      
      <!-- Next Steps Box -->
      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${primaryColor};">
        <p style="margin: 0; color: ${textSecondary};"><strong>Next Steps:</strong></p>
        <ul style="margin: 10px 0 0 0; padding-left: 20px; color: ${textSecondary};">
          <li>Sign in to your account</li>
          <li>Complete your medical profile</li>
          <li>Book your first appointment</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 25px 0;">
        ${getActionButton("Sign In", "#", secondaryColor)}
      </div>
      
      <p style="color: ${textMuted}; font-size: 12px;">If you didn't create this account, please contact us immediately.</p>
    </div>
    ${getEmailFooter()}
  `);
};

export const getWelcomeEmailSubject = (): string => {
  return `Welcome to ${clinicName}`;
};
