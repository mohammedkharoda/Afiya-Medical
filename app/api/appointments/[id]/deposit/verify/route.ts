import { NextRequest, NextResponse } from "next/server";
import { db, appointments, payments } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import {
  withAuth,
  requireRole,
  getAppointmentWithPatient,
  fireAppointmentUpdate,
  notFound,
  forbidden,
  badRequest,
} from "@/lib/api";

export const POST = withAuth(async (req, session, { id: appointmentId }) => {
  const roleError = requireRole(session, "DOCTOR", "ADMIN");
  if (roleError) return roleError;

  const appointment = await getAppointmentWithPatient(appointmentId);
  if (!appointment) return notFound("Appointment");

  if (appointment.doctorId !== session.user.id && session.user.role !== "ADMIN") {
    return forbidden("You are not authorized to verify this payment");
  }

  if (!appointment.isVideoConsultation) {
    return badRequest("This is not a video consultation");
  }

  if (!appointment.depositConfirmedAt) {
    return badRequest("Patient has not confirmed deposit payment yet");
  }

  if (appointment.depositPaid) {
    return badRequest("Deposit payment already verified");
  }

  const now = new Date();

  const [updatedAppointment] = await db
    .update(appointments)
    .set({
      depositPaid: true,
      depositVerifiedAt: now,
      depositCancellationScheduledAt: null,
      updatedAt: now,
    })
    .where(eq(appointments.id, appointmentId))
    .returning();

  const depositPayment = await db.query.payments.findFirst({
    where: and(eq(payments.appointmentId, appointmentId), eq(payments.status, "PENDING")),
  });

  if (depositPayment) {
    await db
      .update(payments)
      .set({ status: "PAID", paidAt: now, verifiedByDoctor: true, verifiedAt: now })
      .where(eq(payments.id, depositPayment.id));
  }

  fireAppointmentUpdate({
    id: updatedAppointment.id,
    status: updatedAppointment.status,
    patientId: updatedAppointment.patientId,
  });

  return NextResponse.json({
    success: true,
    message: "Deposit payment verified successfully",
    appointment: updatedAppointment,
  });
});
