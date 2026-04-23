interface EmailReferenceData {
  doctorPublicId?: string | null;
  patientPublicId?: string | null;
}

const getReferenceLine = (label: string, value?: string | null) =>
  `<p style="margin: 4px 0;"><strong>${label}:</strong> ${value || "Not available"}</p>`;

export const getReferenceBlock = ({
  doctorPublicId,
  patientPublicId,
}: EmailReferenceData) => {
  if (!doctorPublicId && !patientPublicId) {
    return "";
  }

  return `
    <div style="margin-top: 24px; padding: 14px 16px; border: 1px solid #e5e7eb; border-radius: 10px; background: #fafaf9; color: #6b7280; font-size: 12px;">
      <p style="margin: 0 0 8px 0; color: #1f2937; font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase;">Reference IDs</p>
      ${getReferenceLine("Doctor ID", doctorPublicId)}
      ${getReferenceLine("Patient ID", patientPublicId)}
    </div>
  `;
};
