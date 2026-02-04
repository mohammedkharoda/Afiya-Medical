// Base email layout components - Wrapper, Header, Footer

import { EMAIL_CONFIG } from "./config";

const {
  clinicName,
  logoUrl,
  primaryColor,
  secondaryColor,
  textMuted,
  borderColor,
  address,
} = EMAIL_CONFIG;

/**
 * Email header with logo and title
 * @param title - The header title text
 */
export const getEmailHeader = (title: string) => `
  <div style="background: ${primaryColor}; padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0;">
    <img src="${logoUrl}" alt="${clinicName} Logo" style="height: 90px; margin-bottom: 12px; border-radius: 8px;" />
    <h1 style="color: #000000; margin: 0; font-size: 22px; font-weight: 600; letter-spacing: -0.3px;">${title}</h1>
  </div>
`;

/**
 * Email footer with clinic name and disclaimer
 */
export const getEmailFooter = (options?: { address?: string }) => `
  <div style="text-align: center; margin-top: 20px; padding: 20px; color: ${textMuted}; font-size: 12px; border-top: 1px solid ${borderColor};">
    <p style="margin: 5px 0;">${clinicName}</p>
    <p style="margin: 5px 0;">${options?.address || address}</p>
    <p style="margin: 5px 0;">This is an automated email. Please do not reply to this message.</p>
  </div>
`;

/**
 * Base email wrapper - wraps all email content
 * @param content - The HTML content to wrap
 */
export const getEmailWrapper = (content: string) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
    ${content}
  </body>
</html>
`;

/**
 * Card container for email content
 */
export const getEmailCard = (content: string) => `
  <div style="background: #ffffff; padding: 30px; border: 1px solid ${borderColor}; border-top: none; border-radius: 0 0 10px 10px;">
    ${content}
  </div>
`;

/**
 * Info box component
 * @param content - The content inside the box
 * @param borderColor - Left border color (defaults to primary)
 * @param bgColor - Background color (defaults to light gray)
 */
export const getInfoBox = (
  content: string,
  borderLeftColor?: string,
  bgColor?: string,
) => `
  <div style="background: ${bgColor || EMAIL_CONFIG.bgLight}; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${borderLeftColor || primaryColor};">
    ${content}
  </div>
`;

/**
 * Details box with multiple fields
 */
export const getDetailsBox = (fields: { label: string; value: string }[]) => `
  <div style="background: ${EMAIL_CONFIG.bgLight}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${primaryColor};">
    ${fields.map((f) => `<p style="margin: 8px 0;"><strong>${f.label}:</strong> ${f.value}</p>`).join("")}
  </div>
`;

/**
 * Primary action button
 */
export const getActionButton = (
  text: string,
  url: string,
  secondaryColor: string,
) => `
  <div style="text-align: center; margin: 30px 0;">
    <a href="${url}" style="background:${secondaryColor}; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">${text}</a>
  </div>
`;
