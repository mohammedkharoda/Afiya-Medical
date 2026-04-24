import { NextRequest, NextResponse } from "next/server";
import { db, appointments } from "@/lib/db";
import { eq } from "drizzle-orm";
import {
  withAuth,
  getAppointmentWithPatient,
  fireAppointmentUpdate,
  notFound,
  forbidden,
  badRequest,
} from "@/lib/api";
import {
  notifyPatientAppointmentStatusChange,
  notifyDoctorAppointmentCancelledByPatient,
} from "@/lib/notifications";
import { format } from "date-fns";

export const POST = withAuth(async (req, session, { id: appointmentId }) => {
  const body = await req.json();
  const { reason } = body;

  if (!reason || reason.trim().length < 10) {
    return badRequest("Cancellation reason must be at least 10 characters");
  }

  const appointment = await getAppointmentWithPatient(appointmentId);
  if (!appointment) return notFound("Appointment");

  const isDoctor = session.user.role === "DOCTOR" || session.user.role === "ADMIN";
  const isPatientOwner = appointment.patient.userId === session.user.id;

  if (!isDoctor && !isPatientOwner) {
    return forbidden("You are not authorized to cancel this appointment");
  }

  if (appointment.status !== "SCHEDULED" && appointment.status !== "RESCHEDULED") {
    return badRequest("Only scheduled or rescheduled appointments can be cancelled");
  }

  const [updatedAppointment] = await db
    .update(appointments)
    .set({
      status: "CANCELLED",
      cancellationReason: reason.trim(),
      cancelledAt: new Date(),
      cancelledBy: session.user.id,
      updatedAt: new Date(),
    })
    .where(eq(appointments.id, appointmentId))
    .returning();

  const formattedDate = format(appointment.appointmentDate, "MMMM d, yyyy");
  const patientUserId = appointment.patient?.user?.id;

  if (isDoctor && patientUserId) {
    notifyPatientAppointmentStatusChange(
      patientUserId,
      "CANCELLED",
      formattedDate,
      appointment.appointmentTime,
      appointment.doctorId || undefined,
    ).catch((err) => console.error("Error notifying patient of cancellation:", err));
  }

  if (!isDoctor && isPatientOwner) {
    notifyDoctorAppointmentCancelledByPatient(
      session.user.id,
      formattedDate,
      appointment.appointmentTime,
      reason.trim(),
      appointment.doctorId || undefined,
    ).catch((err) => console.error("Error notifying doctor of patient cancellation:", err));
  }

  fireAppointmentUpdate({
    id: updatedAppointment.id,
    status: updatedAppointment.status,
    patientId: updatedAppointment.patientId,
  });

  return NextResponse.json({ success: true, message: "Appointment cancelled successfully" });
});
