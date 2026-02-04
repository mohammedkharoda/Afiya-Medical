import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { triggerNotification } from "@/lib/pusher";
import {
  sendAppointmentConfirmationEmail,
  sendAppointmentStatusEmail,
  sendNewAppointmentAlertEmail,
  sendAppointmentApprovalRequestEmail,
  sendAppointmentApprovedEmail,
  sendAppointmentDeclinedEmail,
  sendAppointmentCancelledByPatientEmail,
} from "@/lib/email";
import { CLINIC_NAME, NOTIFICATION_MESSAGES } from "@/lib/constants";
import { getDoctor, getDoctorById } from "@/lib/doctor";
import {
  sendAppointmentConfirmationPush,
  sendAppointmentStatusPush,
  sendNewAppointmentAlertPush,
} from "@/lib/pusher-beams-server";

// Get user's email by userId
async function getUserEmail(userId: string): Promise<string | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { email: true },
  });
  return user?.email || null;
}

// Get user's name by userId
async function getUserName(userId: string): Promise<string> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { name: true },
  });
  return user?.name || "Patient";
}

// Notify patient when appointment is booked
export async function notifyPatientAppointmentBooked(
  userId: string,
  date: string,
  time: string,
  doctorId?: string,
) {
  const patientName = await getUserName(userId);
  const patientEmail = await getUserEmail(userId);

  // Get specific doctor if doctorId provided, otherwise fallback to first doctor
  let doctorName = "Doctor";
  let clinicAddress: string | null = null;
  if (doctorId) {
    const doctor = await getDoctorById(doctorId);
    if (doctor) {
      doctorName = doctor.name;
      clinicAddress = doctor.clinicAddress || null;
    }
  } else {
    const doctor = await getDoctor();
    doctorName = doctor?.name || "Doctor";
    clinicAddress = doctor?.clinicAddress || null;
  }

  // Trigger real-time notification via Pusher
  await triggerNotification(userId, {
    id: `appointment-${Date.now()}`,
    type: "APPOINTMENT_CONFIRMATION",
    title: "Appointment Booked",
    message: NOTIFICATION_MESSAGES.APPOINTMENT_BOOKED_PATIENT(date, time),
    createdAt: new Date(),
  });

  // Send email
  if (patientEmail) {
    await sendAppointmentConfirmationEmail(
      patientEmail,
      patientName,
      date,
      time,
      doctorName,
      CLINIC_NAME,
      clinicAddress || undefined,
    );
  }

  // Send browser push notification
  await sendAppointmentConfirmationPush(userId, date, time);
}

// Get user's phone number by userId
async function getUserPhone(userId: string): Promise<string | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { phone: true },
  });
  return user?.phone || null;
}

// Notify doctor when new appointment is booked
export async function notifyDoctorNewAppointment(
  patientUserId: string,
  date: string,
  time: string,
  symptoms: string,
  doctorId?: string,
) {
  const patientName = await getUserName(patientUserId);
  const patientPhone = await getUserPhone(patientUserId);

  // Get specific doctor if doctorId provided, otherwise fallback to first doctor
  const doctor = doctorId ? await getDoctorById(doctorId) : await getDoctor();

  if (doctor) {
    // Trigger real-time notification via Pusher
    await triggerNotification(doctor.id, {
      id: `new-appointment-${Date.now()}`,
      type: "GENERAL",
      title: "New Appointment",
      message: NOTIFICATION_MESSAGES.APPOINTMENT_BOOKED_DOCTOR(
        patientName,
        date,
        time,
      ),
      createdAt: new Date(),
    });

    // Send email to doctor
    await sendNewAppointmentAlertEmail(
      doctor.email,
      patientName,
      patientPhone || "Not provided",
      date,
      time,
      symptoms,
      CLINIC_NAME,
      doctor.clinicAddress || undefined,
    );
  }

  // Send browser push notification to doctor
  await sendNewAppointmentAlertPush(patientName, date, time);
}

// Notify patient when appointment status changes
export async function notifyPatientAppointmentStatusChange(
  userId: string,
  status: string,
  date: string,
  time: string,
  doctorId?: string,
) {
  const patientName = await getUserName(userId);
  const patientEmail = await getUserEmail(userId);
  let clinicAddress: string | null = null;

  if (doctorId) {
    const doctor = await getDoctorById(doctorId);
    clinicAddress = doctor?.clinicAddress || null;
  } else {
    const doctor = await getDoctor();
    clinicAddress = doctor?.clinicAddress || null;
  }

  let title = "Appointment Update";
  let message = "";

  switch (status) {
    case "COMPLETED":
      title = "Appointment Completed";
      message = NOTIFICATION_MESSAGES.APPOINTMENT_COMPLETED(date);
      break;
    case "CANCELLED":
      title = "Appointment Cancelled";
      message = NOTIFICATION_MESSAGES.APPOINTMENT_CANCELLED(date, time);
      break;
    case "RESCHEDULED":
      title = "Appointment Rescheduled";
      message = `Your appointment has been rescheduled to ${date} at ${time}. Please check your dashboard for details.`;
      break;
    default:
      message = `Your appointment status has been updated to ${status}.`;
  }

  // Trigger real-time notification via Pusher
  await triggerNotification(userId, {
    id: `appointment-status-${Date.now()}`,
    type: "APPOINTMENT_CONFIRMATION",
    title,
    message,
    createdAt: new Date(),
  });

  // Send email
  if (patientEmail) {
    await sendAppointmentStatusEmail(
      patientEmail,
      patientName,
      status,
      date,
      time,
      CLINIC_NAME,
      clinicAddress || undefined,
    );
  }

  // Send browser push notification
  if (
    status === "COMPLETED" ||
    status === "CANCELLED" ||
    status === "RESCHEDULED"
  ) {
    await sendAppointmentStatusPush(userId, status, date);
  }
}

// ============================================================================
// APPROVAL WORKFLOW NOTIFICATIONS
// ============================================================================

// Notify patient when appointment is pending approval
// Note: Email is intentionally NOT sent here - patient only receives in-app notification
// Doctor will review and approve/decline, and patient will receive email at that time
export async function notifyPatientAppointmentPending(
  userId: string,
  date: string,
  time: string,
) {
  // Trigger real-time notification via Pusher (in-app only, no email)
  await triggerNotification(userId, {
    id: `appointment-pending-${Date.now()}`,
    type: "APPOINTMENT_CONFIRMATION",
    title: "Appointment Request Submitted",
    message: NOTIFICATION_MESSAGES.APPOINTMENT_PENDING_PATIENT(date, time),
    createdAt: new Date(),
  });
}

// Notify doctor when new appointment needs approval
export async function notifyDoctorApprovalNeeded(
  patientUserId: string,
  date: string,
  time: string,
  symptoms: string,
  doctorId?: string,
) {
  const patientName = await getUserName(patientUserId);
  const patientPhone = await getUserPhone(patientUserId);

  // Get specific doctor if doctorId provided, otherwise fallback to first doctor
  const doctor = doctorId ? await getDoctorById(doctorId) : await getDoctor();

  if (doctor) {
    // Trigger real-time notification via Pusher
    await triggerNotification(doctor.id, {
      id: `approval-needed-${Date.now()}`,
      type: "GENERAL",
      title: "Action Required: New Appointment",
      message: NOTIFICATION_MESSAGES.APPOINTMENT_APPROVAL_NEEDED(
        patientName,
        date,
        time,
      ),
      createdAt: new Date(),
    });

    // Send email to doctor
    await sendAppointmentApprovalRequestEmail(
      doctor.email,
      patientName,
      patientPhone || "Not provided",
      date,
      time,
      symptoms,
      CLINIC_NAME,
      doctor.clinicAddress || undefined,
    );
  }
}

// Notify patient when appointment is approved
export async function notifyPatientAppointmentApproved(
  userId: string,
  date: string,
  time: string,
  doctorId?: string,
) {
  const patientName = await getUserName(userId);
  const patientEmail = await getUserEmail(userId);

  // Get specific doctor if doctorId provided, otherwise fallback to first doctor
  let doctorName = "Doctor";
  let clinicAddress: string | null = null;
  if (doctorId) {
    const doctor = await getDoctorById(doctorId);
    if (doctor) {
      doctorName = doctor.name;
      clinicAddress = doctor.clinicAddress || null;
    }
  } else {
    const doctor = await getDoctor();
    doctorName = doctor?.name || "Doctor";
    clinicAddress = doctor?.clinicAddress || null;
  }

  // Trigger real-time notification via Pusher
  await triggerNotification(userId, {
    id: `appointment-approved-${Date.now()}`,
    type: "APPOINTMENT_CONFIRMATION",
    title: "Appointment Confirmed",
    message: NOTIFICATION_MESSAGES.APPOINTMENT_APPROVED(date, time),
    createdAt: new Date(),
  });

  // Send email
  if (patientEmail) {
    await sendAppointmentApprovedEmail(
      patientEmail,
      patientName,
      date,
      time,
      doctorName,
      CLINIC_NAME,
      clinicAddress || undefined,
    );
  }

  // Send browser push notification
  await sendAppointmentConfirmationPush(userId, date, time);
}

// Notify patient when appointment is declined
export async function notifyPatientAppointmentDeclined(
  userId: string,
  date: string,
  time: string,
  reason: string,
  doctorId?: string,
) {
  const patientName = await getUserName(userId);
  const patientEmail = await getUserEmail(userId);
  let clinicAddress: string | null = null;

  if (doctorId) {
    const doctor = await getDoctorById(doctorId);
    clinicAddress = doctor?.clinicAddress || null;
  } else {
    const doctor = await getDoctor();
    clinicAddress = doctor?.clinicAddress || null;
  }

  // Trigger real-time notification via Pusher
  await triggerNotification(userId, {
    id: `appointment-declined-${Date.now()}`,
    type: "APPOINTMENT_CONFIRMATION",
    title: "Appointment Declined",
    message: NOTIFICATION_MESSAGES.APPOINTMENT_DECLINED(date, time),
    createdAt: new Date(),
  });

  // Send email
  if (patientEmail) {
    await sendAppointmentDeclinedEmail(
      patientEmail,
      patientName,
      date,
      time,
      reason,
      CLINIC_NAME,
      clinicAddress || undefined,
    );
  }

  // Send browser push notification
  await sendAppointmentStatusPush(userId, "DECLINED", date);
}

// Notify doctor when patient cancels their appointment
export async function notifyDoctorAppointmentCancelledByPatient(
  patientUserId: string,
  date: string,
  time: string,
  reason: string,
  doctorId?: string,
) {
  const patientName = await getUserName(patientUserId);
  const patientPhone = await getUserPhone(patientUserId);

  // Get specific doctor if doctorId provided, otherwise fallback to first doctor
  const doctor = doctorId ? await getDoctorById(doctorId) : await getDoctor();

  if (doctor) {
    // Trigger real-time notification via Pusher
    await triggerNotification(doctor.id, {
      id: `patient-cancelled-${Date.now()}`,
      type: "GENERAL",
      title: "Patient Cancelled Appointment",
      message: NOTIFICATION_MESSAGES.APPOINTMENT_CANCELLED_BY_PATIENT(
        patientName,
        date,
        time,
      ),
      createdAt: new Date(),
    });

    // Send email to doctor
    await sendAppointmentCancelledByPatientEmail(
      doctor.email,
      patientName,
      patientPhone || "Not provided",
      date,
      time,
      reason,
      doctor.clinicAddress || undefined,
    );
  }
}
