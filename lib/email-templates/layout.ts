// Base email layout components - Wrapper, Header, Footer

import { getAppBaseUrl } from "@/lib/app-url";
import { EMAIL_CONFIG } from "./config";

const {
  brandName,
  brandTagline,
  clinicName,
  primaryColor,
  textMuted,
  textSecondary,
  borderColor,
  address,
} = EMAIL_CONFIG;

const EMAIL_BRAND_FONT_URL = `${getAppBaseUrl()}/fonts/Mluvka/Mluvka-Bold-BF65518ac8cff8c.otf`;

export const getEmailBrandBlock = (
  options?: {
    align?: "left" | "center" | "right";
    brandColor?: string;
    subtitleColor?: string;
    marginBottom?: string;
  },
) => `
  <div style="text-align: ${options?.align || "center"}; margin-bottom: ${options?.marginBottom || "18px"};">
    <div style="display: inline-block; text-align: left;">
      <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
        <tr>
          <td style="padding-right: 12px; vertical-align: middle;">
            <div style="width: 46px; height: 46px; border-radius: 999px; background: #ffffff; box-shadow: 0 10px 22px -16px rgba(15, 23, 42, 0.45); position: relative; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.7);">
              <div style="position: absolute; inset: 7px; border-radius: 999px; background: linear-gradient(135deg, #67c7be 0%, #86d7ca 42%, #ffd0be 100%);"></div>
              <div style="position: absolute; left: 11px; top: 9px; width: 14px; height: 20px; border: 3px solid #ffffff; border-right: 0; border-bottom: 0; border-radius: 14px 0 0 0; transform: rotate(-35deg); opacity: 0.96;"></div>
              <div style="position: absolute; right: 10px; top: 10px; width: 14px; height: 20px; border: 3px solid #ffffff; border-left: 0; border-bottom: 0; border-radius: 0 14px 0 0; transform: rotate(35deg); opacity: 0.96;"></div>
              <div style="position: absolute; left: 16px; top: 21px; width: 14px; height: 14px; background: #ffffff; transform: rotate(45deg); border-radius: 3px;"></div>
            </div>
          </td>
          <td style="vertical-align: middle;">
            <div style="font-family: 'Afiya Mluvka', 'Trebuchet MS', 'Segoe UI', Arial, sans-serif; font-size: 38px; line-height: 1; font-weight: 700; letter-spacing: -0.05em; text-transform: none; color: ${options?.brandColor || "#233234"};">
              ${brandName}
            </div>
          </td>
        </tr>
      </table>
    </div>
    <p style="margin: 8px 0 0 0; color: ${options?.subtitleColor || textSecondary}; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase;">
      ${brandTagline}
    </p>
  </div>
`;

/**
 * Email header with text brand and title
 * @param title - The header title text
 */
export const getEmailHeader = (title: string) => `
  <div style="background: ${primaryColor}; padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0;">
    ${getEmailBrandBlock({
      brandColor: "#163131",
      subtitleColor: "#334155",
    })}
    <h1 style="color: #000000; margin: 0; font-size: 22px; font-weight: 600; letter-spacing: -0.3px;">${title}</h1>
  </div>
`;

/**
 * Email footer with clinic name and disclaimer
 */
export const getEmailFooter = (options?: {
  address?: string;
  showAddress?: boolean;
}) => `
  <div style="text-align: center; margin-top: 20px; padding: 20px; color: ${textMuted}; font-size: 12px; border-top: 1px solid ${borderColor};">
    <p style="margin: 5px 0;">${clinicName}</p>
    ${
      options?.showAddress
        ? `<p style="margin: 5px 0;">${options.address || address}</p>`
        : ""
    }
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
    <style>
      @font-face {
        font-family: 'Afiya Mluvka';
        src: url('${EMAIL_BRAND_FONT_URL}') format('opentype');
        font-weight: 700;
        font-style: normal;
      }
    </style>
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
