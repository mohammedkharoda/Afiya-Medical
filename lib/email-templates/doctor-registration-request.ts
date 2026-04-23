import { EMAIL_CONFIG } from "./config";
import {
  getActionButton,
  getEmailFooter,
  getEmailHeader,
  getEmailWrapper,
} from "./layout";

const {
  clinicName,
  secondaryColor,
  textPrimary,
  textSecondary,
  textMuted,
  borderColor,
  bgLight,
  primaryColor,
} = EMAIL_CONFIG;

interface DoctorRegistrationRequestTemplateData {
  doctorEmail: string;
  reviewUrl: string;
  reusedExistingInvitation?: boolean;
}

export const getDoctorRegistrationRequestTemplate = ({
  doctorEmail,
  reviewUrl,
  reusedExistingInvitation = false,
}: DoctorRegistrationRequestTemplateData): string =>
  getEmailWrapper(`
    ${getEmailHeader("Doctor Registration Request")}
    <div style="background: #ffffff; padding: 30px; border: 1px solid ${borderColor}; border-top: none; border-radius: 0 0 10px 10px;">
      <h2 style="color: ${textPrimary}; margin-top: 0;">A doctor requested a registration link</h2>
      <p style="color: ${textSecondary};">
        A doctor has entered their email on the onboarding form for <strong>${clinicName}</strong> and requested access to the registration flow.
      </p>

      <div style="background: ${bgLight}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${primaryColor};">
        <p style="margin: 8px 0;"><strong>Email:</strong> ${doctorEmail}</p>
        <p style="margin: 8px 0;"><strong>Status:</strong> ${reusedExistingInvitation ? "Registration link re-requested" : "New registration link requested"}</p>
      </div>

      <p style="color: ${textMuted}; margin-bottom: 24px;">
        You can monitor doctor onboarding requests and approvals from the admin dashboard.
      </p>

      ${getActionButton("Open Admin Review", reviewUrl, secondaryColor)}
    </div>
    ${getEmailFooter()}
  `);

export const getDoctorRegistrationRequestSubject = () =>
  `Doctor registration link requested - ${clinicName}`;
