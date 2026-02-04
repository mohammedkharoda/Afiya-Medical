// Billing/Invoice Email Template

import { EMAIL_CONFIG } from "./config";
import { getEmailWrapper, getEmailHeader, getEmailFooter } from "./layout";

const { bgLight, borderColor } = EMAIL_CONFIG;

interface BillingTemplateData {
  patientName: string;
  doctorName: string;
  doctorSpeciality: string;
  appointmentDate: string;
  appointmentTime: string;
  consultationFee: number;
  upiId?: string;
  upiQrCode?: string;
  symptoms: string;
  clinicAddress?: string;
}

/**
 * Generate billing/invoice email HTML
 */
export const getBillingTemplate = ({
  patientName,
  doctorName,
  doctorSpeciality,
  appointmentDate,
  appointmentTime,
  consultationFee,
  upiId,
  upiQrCode,
  symptoms,
  clinicAddress,
}: BillingTemplateData): string => {
  const paymentMethods = [];

  if (upiId) {
    paymentMethods.push(`
      <div style="background: ${bgLight}; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
        <h4 style="color: #000000; margin: 0 0 8px 0;">Pay via UPI</h4>
        <p style="margin: 0; font-size: 18px; font-weight: bold; color: #333;">${upiId}</p>
        <p style="margin: 8px 0 0 0; color: #666; font-size: 14px;">Copy this UPI ID and pay using any UPI app</p>
      </div>
    `);
  }

  if (upiQrCode) {
    paymentMethods.push(`
      <div style="background: ${bgLight}; padding: 16px; border-radius: 8px; margin-bottom: 16px; text-align: center;">
        <h4 style="color: #000000; margin: 0 0 12px 0;">Scan QR Code to Pay</h4>
        <img src="${upiQrCode}" alt="UPI QR Code" style="max-width: 200px; height: auto; border: 1px solid ${borderColor}; border-radius: 8px;" />
      </div>
    `);
  }

  paymentMethods.push(`
    <div style="background: ${bgLight}; padding: 16px; border-radius: 8px;">
      <h4 style="color: #000000; margin: 0 0 8px 0;">Pay in Cash</h4>
      <p style="margin: 0; color: #666; font-size: 14px;">You can also pay in cash at the clinic</p>
    </div>
  `);

  // Primary button style
  const buttonStyle = `display: inline-block; background-color: #495057; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;`;

  const content = `
    ${getEmailHeader("Consultation Invoice")}
    
    <p style="color: #666; font-size: 16px; line-height: 1.6;">
      Dear <strong>${patientName}</strong>,
    </p>
    
    <p style="color: #666; font-size: 16px; line-height: 1.6;">
      Your consultation with <strong>Dr. ${doctorName}</strong> has been completed. Please find the invoice details below:
    </p>
    
    <!-- Invoice Details -->
    <div style="background: #fff; border: 1px solid ${borderColor}; border-radius: 12px; padding: 24px; margin: 24px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid ${borderColor};">
            <span style="color: #666;">Doctor</span><br/>
            <strong style="color: #333;">Dr. ${doctorName}</strong>
            <span style="color: #888; font-size: 14px;"> (${doctorSpeciality})</span>
            ${clinicAddress ? `<br/><span style="color: #666; font-size: 13px; margin-top: 4px; display: inline-block;">📍 ${clinicAddress}</span>` : ""}
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid ${borderColor};">
            <span style="color: #666;">Appointment</span><br/>
            <strong style="color: #333;">${appointmentDate} at ${appointmentTime}</strong>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid ${borderColor};">
            <span style="color: #666;">Reason for Visit</span><br/>
            <strong style="color: #333;">${symptoms}</strong>
          </td>
        </tr>
        <tr>
          <td style="padding: 16px 0;">
            <span style="color: #666; font-size: 18px;">Total Amount</span><br/>
            <strong style="color: #495057; font-size: 28px;">₹${consultationFee.toLocaleString("en-IN")}</strong>
          </td>
        </tr>
      </table>
    </div>
    
    <!-- Payment Methods -->
    <div style="margin: 24px 0;">
      <h3 style="color: #333; margin-bottom: 16px;">Payment Options</h3>
      ${paymentMethods.join("")}
    </div>
    
    <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 24px;">
      Once payment is confirmed, you will receive your prescription via email.
    </p>
    
    <p style="color: #666; font-size: 14px; line-height: 1.6;">
      If you have any questions about this invoice, please contact us.
    </p>
    
    ${getEmailFooter({ address: clinicAddress })}
  `;

  return getEmailWrapper(content);
};

export default getBillingTemplate;
