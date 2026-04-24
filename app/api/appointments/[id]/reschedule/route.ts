import { NextRequest, NextResponse } from "next/server";
import { db, appointments } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import {
  withAuth,
  requireRole,
  getAppointmentWithPatient,
  fireAppointmentUpdate,
  notFound,
  badRequest,
} from "@/lib/api";
import { notifyPatientAppointmentStatusChange } from "@/lib/notifications";
import { format } from "date-fns";

export const POST = withAuth(async (req, session, { id: appointmentId }) => {
  const roleError = requireRole(session, "DOCTOR", "ADMIN");
  if (roleError) return roleError;

  const { newDate, newTime, reason } = await req.json();

  if (!newDate || !newTime) {
    return badRequest("New date and time are required");
  }

  const newAppointmentDate = new Date(newDate);
  if (newAppointmentDate < new Date()) {
    return badRequest("Cannot reschedule to a past date");
  }

  const appointment = await getAppointmentWithPatient(appointmentId);
  if (!appointment) return notFound("Appointment");

  if (appointment.status === "CANCELLED") {
    return badRequest("Cannot reschedule a cancelled appointment");
  }

  const conflictingAppointment = await db.query.appointments.findFirst({
    where: and(
      eq(appointments.appointmentDate, newAppointmentDate),
      eq(appointments.appointmentTime, newTime),
    ),
  });

  if (
    conflictingAppointment &&
    conflictingAppointment.id !== appointmentId &&
    (conflictingAppointment.status === "SCHEDULED" || conflictingAppointment.status === "RESCHEDULED")
  ) {
    return badRequest("The selected time slot is already booked");
  }

  const originalDate = appointment.originalAppointmentDate || appointment.appointmentDate;
  const originalTime = appointment.originalAppointmentTime || appointment.appointmentTime;

  const [updatedAppointment] = await db
    .update(appointments)
    .set({
      appointmentDate: newAppointmentDate,
      appointmentTime: newTime,
      status: "RESCHEDULED",
      originalAppointmentDate: originalDate,
      originalAppointmentTime: originalTime,
      rescheduledBy: session.user.id,
      rescheduledAt: new Date(),
      notes: reason
        ? `${appointment.notes || ""}\nReschedule reason: ${reason}`.trim()
        : appointment.notes,
      updatedAt: new Date(),
    })
    .where(eq(appointments.id, appointmentId))
    .returning();

  const patientUserId = appointment.patient?.user?.id;
  if (patientUserId) {
    notifyPatientAppointmentStatusChange(
      patientUserId,
      "RESCHEDULED",
      format(newAppointmentDate, "MMMM d, yyyy"),
      newTime,
      appointment.doctorId || undefined,
    ).catch((err) => console.error("Error notifying patient of reschedule:", err));
  }

  fireAppointmentUpdate({
    id: updatedAppointment.id,
    status: updatedAppointment.status,
    patientId: updatedAppointment.patientId,
  });

  return NextResponse.json({
    success: true,
    message: "Appointment rescheduled successfully",
    appointment: {
      id: appointmentId,
      appointmentDate: newAppointmentDate,
      appointmentTime: newTime,
      status: "RESCHEDULED",
    },
  });
});
