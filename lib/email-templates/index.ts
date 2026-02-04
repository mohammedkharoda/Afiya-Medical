// Email Templates - Central Export
//
// This folder contains all email templates used in the application.
// Edit individual template files to customize the look and feel of emails.
//
// Structure:
// - config.ts           : Global configuration (colors, clinic name, subjects)
// - layout.ts           : Base components (header, footer, wrapper)
// - otp.ts              : OTP verification code email
// - verification.ts     : Email verification link
// - password-reset.ts   : Password reset link
// - welcome.ts          : Welcome/signup notification
// - appointment-confirmation.ts : Appointment confirmed (for patients)
// - appointment-alert.ts        : New appointment (for doctors)
// - appointment-status.ts       : Status updates (completed/cancelled/rescheduled)
// - appointment-reminder.ts     : 30-minute reminder
// - prescription.ts     : Prescription details

// Configuration
export { EMAIL_CONFIG, EMAIL_SUBJECTS } from "./config";

// Layout components
export {
  getEmailWrapper,
  getEmailHeader,
  getEmailFooter,
  getEmailCard,
  getInfoBox,
  getDetailsBox,
  getActionButton,
} from "./layout";

// OTP
export { getOtpEmailTemplate, getOtpEmailSubject } from "./otp";

// Email Verification
export {
  getVerificationEmailTemplate,
  getVerificationEmailSubject,
} from "./verification";

// Password Reset
export {
  getPasswordResetEmailTemplate,
  getPasswordResetEmailSubject,
} from "./password-reset";

// Welcome
export { getWelcomeEmailTemplate, getWelcomeEmailSubject } from "./welcome";

// Appointment - Confirmation (patient)
export {
  getAppointmentConfirmationTemplate,
  getAppointmentConfirmationSubject,
} from "./appointment-confirmation";

// Appointment - Alert (doctor)
export {
  getNewAppointmentAlertTemplate,
  getNewAppointmentAlertSubject,
} from "./appointment-alert";

// Appointment - Status Update
export {
  getAppointmentStatusTemplate,
  getAppointmentStatusSubject,
} from "./appointment-status";

// Appointment - Reminder
export {
  getAppointmentReminderTemplate,
  getAppointmentReminderSubject,
} from "./appointment-reminder";

// Prescription
export {
  getPrescriptionTemplate,
  getPrescriptionSubject,
} from "./prescription";

// Appointment - Pending Approval (patient)
export {
  getAppointmentPendingTemplate,
  getAppointmentPendingSubject,
} from "./appointment-pending";

// Appointment - Approval Request (doctor)
export {
  getAppointmentApprovalRequestTemplate,
  getAppointmentApprovalRequestSubject,
} from "./appointment-approval-request";

// Appointment - Approved (patient)
export {
  getAppointmentApprovedTemplate,
  getAppointmentApprovedSubject,
} from "./appointment-approved";

// Appointment - Declined (patient)
export {
  getAppointmentDeclinedTemplate,
  getAppointmentDeclinedSubject,
} from "./appointment-declined";

// Appointment - Cancelled by Patient (doctor)
export {
  getAppointmentCancelledByPatientTemplate,
  getAppointmentCancelledByPatientSubject,
} from "./appointment-cancelled-by-patient";

// Doctor Invitation
export {
  getDoctorInvitationTemplate,
  getDoctorInvitationSubject,
} from "./doctor-invitation";
