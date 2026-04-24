import { NextRequest, NextResponse } from "next/server";
import { db, appointments } from "@/lib/db";
import { eq } from "drizzle-orm";
import {
  withAuth,
  requireRole,
  getAppointmentWithPatient,
  fireAppointmentUpdate,
  notFound,
  badRequest,
} from "@/lib/api";
import { notifyPatientAppointmentDeclined } from "@/lib/notifications";
import { format } from "date-fns";

export const POST = withAuth(async (req, session, { id: appointmentId }) => {
  const roleError = requireRole(session, "DOCTOR", "ADMIN");
  if (roleError) return roleError;

  const { reason } = await req.json();

  if (!reason || reason.trim().length < 10) {
    return badRequest("Decline reason must be at least 10 characters");
  }

  const appointment = await getAppointmentWithPatient(appointmentId);
  if (!appointment) return notFound("Appointment");

  if (appointment.status !== "PENDING") {
    return badRequest("Only pending appointments can be declined");
  }

  const [updatedAppointment] = await db
    .update(appointments)
    .set({
      status: "DECLINED",
      declinedAt: new Date(),
      declinedBy: session.user.id,
      declineReason: reason.trim(),
      updatedAt: new Date(),
    })
    .where(eq(appointments.id, appointmentId))
    .returning();

  const patientUserId = appointment.patient?.user?.id;
  if (patientUserId) {
    notifyPatientAppointmentDeclined(
      patientUserId,
      format(appointment.appointmentDate, "MMMM d, yyyy"),
      appointment.appointmentTime,
      reason.trim(),
      appointment.doctorId || undefined,
    ).catch((err) => console.error("Error notifying patient of decline:", err));
  }

  fireAppointmentUpdate({
    id: updatedAppointment.id,
    status: updatedAppointment.status,
    patientId: updatedAppointment.patientId,
  });

  return NextResponse.json({
    success: true,
    message: "Appointment declined",
    appointment: updatedAppointment,
  });
});
