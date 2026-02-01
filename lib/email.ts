// Email Service - Using Resend
//
// This file handles all email sending logic.
// Templates are located in ./email-templates/ folder - edit them to customize emails.

import { Resend } from "resend";
import {
  getOtpEmailTemplate,
  getOtpEmailSubject,
  getVerificationEmailTemplate,
  getVerificationEmailSubject,
  getPasswordResetEmailTemplate,
  getPasswordResetEmailSubject,
  getWelcomeEmailTemplate,
  getWelcomeEmailSubject,
  getAppointmentConfirmationTemplate,
  getAppointmentConfirmationSubject,
  getNewAppointmentAlertTemplate,
  getNewAppointmentAlertSubject,
  getAppointmentStatusTemplate,
  getAppointmentStatusSubject,
  getAppointmentReminderTemplate,
  getAppointmentReminderSubject,
  getPrescriptionTemplate,
  getPrescriptionSubject,
  // Approval workflow templates
  getAppointmentPendingTemplate,
  getAppointmentPendingSubject,
  getAppointmentApprovalRequestTemplate,
  getAppointmentApprovalRequestSubject,
  getAppointmentApprovedTemplate,
  getAppointmentApprovedSubject,
  getAppointmentDeclinedTemplate,
  getAppointmentDeclinedSubject,
  getAppointmentCancelledByPatientTemplate,
  getAppointmentCancelledByPatientSubject,
} from "./email-templates";

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Get the from email address
const getFromEmail = () =>
  process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

// ============================================================================
// EMAIL VERIFICATION
// ============================================================================

export async function sendVerificationEmail(email: string, url: string) {
  try {
    const result = await resend.emails.send({
      from: getFromEmail(),
      to: email,
      subject: getVerificationEmailSubject(),
      html: getVerificationEmailTemplate({ url }),
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      throw new Error(result.error.message);
    }

    console.log(`Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
}

// ============================================================================
// PASSWORD RESET
// ============================================================================

export async function sendPasswordResetEmail(email: string, url: string) {
  try {
    const result = await resend.emails.send({
      from: getFromEmail(),
      to: email,
      subject: getPasswordResetEmailSubject(),
      html: getPasswordResetEmailTemplate({ url }),
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      throw new Error(result.error.message);
    }

    console.log(`Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
}

// ============================================================================
// WELCOME / SIGNUP NOTIFICATION
// ============================================================================

export async function sendSignupNotificationEmail(
  email: string,
  phone: string,
) {
  try {
    const result = await resend.emails.send({
      from: getFromEmail(),
      to: email,
      subject: getWelcomeEmailSubject(),
      html: getWelcomeEmailTemplate({ phone }),
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      return false;
    }

    console.log(`Signup notification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending signup notification email:", error);
    return false;
  }
}

// ============================================================================
// OTP VERIFICATION
// ============================================================================

export async function sendOtpEmail(email: string, otp: string) {
  try {
    console.log(`[sendOtpEmail] Attempting to send OTP to ${email}`);
    console.log(`[sendOtpEmail] From: ${getFromEmail()}`);

    const result = await resend.emails.send({
      from: getFromEmail(),
      to: email,
      subject: getOtpEmailSubject(),
      html: getOtpEmailTemplate({ otp }),
    });

    console.log(`[sendOtpEmail] Resend response:`, JSON.stringify(result));

    if (result.error) {
      console.error("[sendOtpEmail] Resend error:", result.error);
      return false;
    }

    console.log(`[sendOtpEmail] OTP email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error("[sendOtpEmail] Error sending OTP email:", error);
    return false;
  }
}

// ============================================================================
// APPOINTMENT CONFIRMATION (for patients)
// ============================================================================

export async function sendAppointmentConfirmationEmail(
  email: string,
  patientName: string,
  date: string,
  time: string,
  doctorName: string,
  clinicName: string,
) {
  try {
    const result = await resend.emails.send({
      from: getFromEmail(),
      to: email,
      subject: getAppointmentConfirmationSubject(clinicName),
      html: getAppointmentConfirmationTemplate({
        patientName,
        date,
        time,
        doctorName,
        clinicName,
      }),
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      return false;
    }

    console.log(`Appointment confirmation email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending appointment confirmation email:", error);
    return false;
  }
}

// ============================================================================
// NEW APPOINTMENT ALERT (for doctors)
// ============================================================================

export async function sendNewAppointmentAlertEmail(
  doctorEmail: string,
  patientName: string,
  patientPhone: string,
  date: string,
  time: string,
  symptoms: string,
  clinicName: string,
) {
  try {
    const result = await resend.emails.send({
      from: getFromEmail(),
      to: doctorEmail,
      subject: getNewAppointmentAlertSubject(clinicName),
      html: getNewAppointmentAlertTemplate({
        patientName,
        patientPhone,
        date,
        time,
        symptoms,
      }),
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      return false;
    }

    console.log(`New appointment alert email sent to ${doctorEmail}`);
    return true;
  } catch (error) {
    console.error("Error sending new appointment alert email:", error);
    return false;
  }
}

// ============================================================================
// APPOINTMENT STATUS UPDATE
// ============================================================================

export async function sendAppointmentStatusEmail(
  email: string,
  patientName: string,
  status: string,
  date: string,
  time: string,
  _clinicName: string,
) {
  try {
    const result = await resend.emails.send({
      from: getFromEmail(),
      to: email,
      subject: getAppointmentStatusSubject(status),
      html: getAppointmentStatusTemplate({
        patientName,
        status,
        date,
        time,
      }),
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      return false;
    }

    console.log(`Appointment status email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending appointment status email:", error);
    return false;
  }
}

// ============================================================================
// APPOINTMENT REMINDER (30 minutes before)
// ============================================================================

export async function sendAppointmentReminderEmail(
  email: string,
  patientName: string,
  date: string,
  time: string,
  doctorName: string,
  clinicName: string,
) {
  try {
    const result = await resend.emails.send({
      from: getFromEmail(),
      to: email,
      subject: getAppointmentReminderSubject(clinicName),
      html: getAppointmentReminderTemplate({
        patientName,
        date,
        time,
        doctorName,
        clinicName,
      }),
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      return false;
    }

    console.log(`Appointment reminder email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending appointment reminder email:", error);
    return false;
  }
}

// ============================================================================
// PRESCRIPTION
// ============================================================================

interface PrescriptionEmailData {
  patientEmail: string;
  patientName: string;
  doctorName: string;
  diagnosis: string;
  medications: Array<{
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  notes?: string;
  followUpDate?: string;
  attachmentUrl?: string;
  prescriptionDate: string;
}

export async function sendPrescriptionEmail(
  data: PrescriptionEmailData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await resend.emails.send({
      from: getFromEmail(),
      to: data.patientEmail,
      subject: getPrescriptionSubject(data.doctorName),
      html: getPrescriptionTemplate({
        patientName: data.patientName,
        doctorName: data.doctorName,
        diagnosis: data.diagnosis,
        medications: data.medications,
        notes: data.notes,
        followUpDate: data.followUpDate,
        attachmentUrl: data.attachmentUrl,
        prescriptionDate: data.prescriptionDate,
      }),
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      return { success: false, error: result.error.message };
    }

    console.log("Prescription email sent successfully:", result.data?.id);
    return { success: true };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending prescription email:", error);
    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// APPOINTMENT PENDING (for patients - when booking awaits approval)
// ============================================================================

export async function sendAppointmentPendingEmail(
  email: string,
  patientName: string,
  date: string,
  time: string,
  doctorName: string,
  clinicName: string,
) {
  try {
    const result = await resend.emails.send({
      from: getFromEmail(),
      to: email,
      subject: getAppointmentPendingSubject(clinicName),
      html: getAppointmentPendingTemplate({
        patientName,
        date,
        time,
        doctorName,
        clinicName,
      }),
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      return false;
    }

    console.log(`Appointment pending email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending appointment pending email:", error);
    return false;
  }
}

// ============================================================================
// APPOINTMENT APPROVAL REQUEST (for doctors - when new appointment needs approval)
// ============================================================================

export async function sendAppointmentApprovalRequestEmail(
  doctorEmail: string,
  patientName: string,
  patientPhone: string,
  date: string,
  time: string,
  symptoms: string,
  clinicName: string,
) {
  try {
    const result = await resend.emails.send({
      from: getFromEmail(),
      to: doctorEmail,
      subject: getAppointmentApprovalRequestSubject(clinicName),
      html: getAppointmentApprovalRequestTemplate({
        patientName,
        patientPhone,
        date,
        time,
        symptoms,
        clinicName,
      }),
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      return false;
    }

    console.log(`Appointment approval request email sent to ${doctorEmail}`);
    return true;
  } catch (error) {
    console.error("Error sending appointment approval request email:", error);
    return false;
  }
}

// ============================================================================
// APPOINTMENT APPROVED (for patients - when doctor approves)
// ============================================================================

export async function sendAppointmentApprovedEmail(
  email: string,
  patientName: string,
  date: string,
  time: string,
  doctorName: string,
  clinicName: string,
) {
  try {
    const result = await resend.emails.send({
      from: getFromEmail(),
      to: email,
      subject: getAppointmentApprovedSubject(clinicName),
      html: getAppointmentApprovedTemplate({
        patientName,
        date,
        time,
        doctorName,
        clinicName,
      }),
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      return false;
    }

    console.log(`Appointment approved email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending appointment approved email:", error);
    return false;
  }
}

// ============================================================================
// APPOINTMENT DECLINED (for patients - when doctor declines)
// ============================================================================

export async function sendAppointmentDeclinedEmail(
  email: string,
  patientName: string,
  date: string,
  time: string,
  reason: string | undefined,
  clinicName: string,
) {
  try {
    const result = await resend.emails.send({
      from: getFromEmail(),
      to: email,
      subject: getAppointmentDeclinedSubject(clinicName),
      html: getAppointmentDeclinedTemplate({
        patientName,
        date,
        time,
        reason,
        clinicName,
      }),
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      return false;
    }

    console.log(`Appointment declined email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending appointment declined email:", error);
    return false;
  }
}

// ============================================================================
// APPOINTMENT CANCELLED BY PATIENT (for doctors)
// ============================================================================

export async function sendAppointmentCancelledByPatientEmail(
  doctorEmail: string,
  patientName: string,
  patientPhone: string,
  date: string,
  time: string,
  reason: string,
) {
  try {
    const result = await resend.emails.send({
      from: getFromEmail(),
      to: doctorEmail,
      subject: getAppointmentCancelledByPatientSubject("Afiya Medical Clinic"),
      html: getAppointmentCancelledByPatientTemplate({
        patientName,
        patientPhone,
        date,
        time,
        reason,
      }),
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      return false;
    }

    console.log(`Patient cancellation email sent to ${doctorEmail}`);
    return true;
  } catch (error) {
    console.error("Error sending patient cancellation email:", error);
    return false;
  }
}
