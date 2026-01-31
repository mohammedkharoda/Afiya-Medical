import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { triggerNotification } from "@/lib/pusher";
import {
  sendAppointmentConfirmationEmail,
  sendAppointmentStatusEmail,
  sendNewAppointmentAlertEmail,
} from "@/lib/email";
import { CLINIC_NAME, NOTIFICATION_MESSAGES } from "@/lib/constants";
import { getDoctor } from "@/lib/doctor";
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
) {
  const patientName = await getUserName(userId);
  const patientEmail = await getUserEmail(userId);
  const doctor = await getDoctor();
  const doctorName = doctor?.name || "Doctor";

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
) {
  const patientName = await getUserName(patientUserId);
  const patientPhone = await getUserPhone(patientUserId);
  const doctor = await getDoctor();

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
) {
  const patientName = await getUserName(userId);
  const patientEmail = await getUserEmail(userId);

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
