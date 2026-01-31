// OTP Verification Email Template

import { EMAIL_CONFIG } from "./config";
import { getEmailWrapper, getEmailHeader, getEmailFooter } from "./layout";

const { clinicName, textPrimary, textSecondary, textLight, bgLight } =
  EMAIL_CONFIG;

interface OtpTemplateData {
  otp: string;
}

/**
 * Generate OTP verification email HTML
 *
 * Customize:
 * - Change the OTP display style in the span element
 * - Modify the expiry time message
 * - Add additional instructions
 */
export const getOtpEmailTemplate = ({ otp }: OtpTemplateData): string => {
  return getEmailWrapper(`
    ${getEmailHeader("Verification Code")}
    <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
      <h2 style="color: ${textPrimary}; margin-top: 0;">Your OTP Code</h2>
      <p style="color: ${textSecondary};">Use this code to verify your account:</p>
      
      <!-- OTP Code Display - Customize the styling here -->
      <div style="text-align: center; margin: 30px 0;">
        <span style="background: ${bgLight}; padding: 15px 30px; font-size: 32px; font-weight: bold; letter-spacing: 8px; border-radius: 8px; display: inline-block; color: ${textPrimary};">${otp}</span>
      </div>
      
      <p style="color: ${textLight}; font-size: 12px; text-align: center;">
        This code will expire in 10 minutes. Do not share this code with anyone.
      </p>
    </div>
    ${getEmailFooter()}
  `);
};

export const getOtpEmailSubject = (): string => {
  return `Your verification code - ${clinicName}`;
};
