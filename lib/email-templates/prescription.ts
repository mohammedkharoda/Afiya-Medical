// Prescription Email Template

import { EMAIL_CONFIG } from "./config";
import { getEmailWrapper, getEmailHeader, getEmailFooter } from "./layout";

const {
  clinicName,
  primaryColor,
  secondaryColor,
  warningColor,
  infoColor,
  bgLight,
  bgWarning,
  bgInfo,
  borderColor,
} = EMAIL_CONFIG;

interface Medication {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface PrescriptionTemplateData {
  patientName: string;
  doctorName: string;
  diagnosis: string;
  medications: Medication[];
  notes?: string;
  followUpDate?: string;
  attachmentUrl?: string;
  prescriptionDate: string;
}

/**
 * Generate medications list HTML
 */
const getMedicationsList = (medications: Medication[]): string => {
  return medications
    .map(
      (med, index) =>
        `<li style="margin-bottom: 12px;">
          <strong>${index + 1}. ${med.medicineName}</strong><br/>
          <span style="color: #666;">Dosage: ${med.dosage} | Frequency: ${med.frequency} | Duration: ${med.duration}</span>
        </li>`,
    )
    .join("");
};

/**
 * Generate prescription email HTML
 *
 * Customize:
 * - Change medication display format
 * - Add pharmacy information
 * - Include drug interaction warnings
 * - Add refill instructions
 */
export const getPrescriptionTemplate = ({
  patientName,
  doctorName,
  diagnosis,
  medications,
  notes,
  followUpDate,
  attachmentUrl,
  prescriptionDate,
}: PrescriptionTemplateData): string => {
  const medicationsList = getMedicationsList(medications);

  return getEmailWrapper(`
    ${getEmailHeader("New Prescription Ready")}
    <div style="background: #ffffff; padding: 30px; border: 1px solid ${borderColor}; border-top: none; border-radius: 0 0 10px 10px;">
      <p style="font-size: 16px; margin-bottom: 20px;">Dear <strong>${patientName}</strong>,</p>

      <p style="font-size: 16px; margin-bottom: 20px;">
        Your prescription from <strong>Dr. ${doctorName}</strong> is now available.
      </p>

      <!-- Prescription Details -->
      <div style="background: ${bgLight}; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid ${primaryColor};">
        <h2 style="color: ${primaryColor}; margin-top: 0; font-size: 18px;">Prescription Details</h2>
        <p style="margin: 8px 0;"><strong>Date:</strong> ${prescriptionDate}</p>
        <p style="margin: 8px 0;"><strong>Diagnosis:</strong> ${diagnosis}</p>
      </div>

      <!-- Medications List -->
      <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid ${borderColor};">
        <h3 style="color: ${primaryColor}; margin-top: 0; font-size: 18px;">💊 Medications</h3>
        <ol style="padding-left: 20px; margin: 0;">
          ${medicationsList}
        </ol>
      </div>

      ${
        notes
          ? `
      <!-- Doctor's Notes -->
      <div style="background: ${bgWarning}; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid ${warningColor};">
        <p style="margin: 0;"><strong>📝 Note from Doctor:</strong> ${notes}</p>
      </div>
      `
          : ""
      }

      ${
        followUpDate
          ? `
      <!-- Follow-up Date -->
      <div style="background: ${bgInfo}; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid ${infoColor};">
        <p style="margin: 0;"><strong>📅 Follow-up Date:</strong> ${followUpDate}</p>
      </div>
      `
          : ""
      }

      ${
        attachmentUrl
          ? `
      <!-- Download Button -->
      <div style="text-align: center; margin: 20px 0;">
        <a href="${attachmentUrl}" target="_blank" style="display: inline-block; background: ${secondaryColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          📎 Download Prescription Attachment
        </a>
      </div>
      `
          : ""
      }

      <!-- Footer Note -->
      <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid ${borderColor}; text-align: center; color: #666; font-size: 14px;">
        <p>You can also view this prescription by logging into your patient portal.</p>
        <p style="margin-top: 15px;">
          <strong>⚠️ Important:</strong> Follow the medication schedule as prescribed. Contact your doctor if you experience any adverse effects.
        </p>
      </div>
    </div>
    ${getEmailFooter()}
  `);
};

export const getPrescriptionSubject = (doctorName: string): string => {
  return `New Prescription from Dr. ${doctorName} - ${clinicName}`;
};
