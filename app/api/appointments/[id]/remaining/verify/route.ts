import { NextRequest, NextResponse } from "next/server";
import { db, appointments, payments } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import {
  withAuth,
  requireRole,
  fireAppointmentUpdate,
  notFound,
  forbidden,
  badRequest,
} from "@/lib/api";

export const POST = withAuth(async (req, session, { id: appointmentId }) => {
  const roleError = requireRole(session, "DOCTOR", "ADMIN");
  if (roleError) return roleError;

  const appointment = await db.query.appointments.findFirst({
    where: eq(appointments.id, appointmentId),
    with: {
      patient: { with: { user: true } },
      prescription: { with: { medications: true } },
    },
  });

  if (!appointment) return notFound("Appointment");

  if (appointment.doctorId !== session.user.id && session.user.role !== "ADMIN") {
    return forbidden("You are not authorized to verify this payment");
  }

  if (!appointment.isVideoConsultation) {
    return badRequest("This is not a video consultation");
  }

  if (appointment.status !== "COMPLETED") {
    return badRequest("Appointment must be completed before verifying remaining payment");
  }

  if (!appointment.remainingConfirmedAt) {
    return badRequest("Patient has not confirmed remaining payment yet");
  }

  if (appointment.remainingPaid) {
    return badRequest("Remaining payment already verified");
  }

  const now = new Date();

  const [updatedAppointment] = await db
    .update(appointments)
    .set({
      remainingPaid: true,
      remainingVerifiedAt: now,
      paymentStatus: "PAID",
      prescriptionWithheld: false,
      prescriptionSent: true,
      prescriptionSentAt: now,
      updatedAt: now,
    })
    .where(eq(appointments.id, appointmentId))
    .returning();

  const remainingPayment = await db.query.payments.findFirst({
    where: and(eq(payments.appointmentId, appointmentId), eq(payments.status, "PENDING")),
  });

  if (remainingPayment) {
    await db
      .update(payments)
      .set({ status: "PAID", paidAt: now, verifiedByDoctor: true, verifiedAt: now })
      .where(eq(payments.id, remainingPayment.id));
  }

  fireAppointmentUpdate({
    id: updatedAppointment.id,
    status: updatedAppointment.status,
    patientId: updatedAppointment.patientId,
  });

  return NextResponse.json({
    success: true,
    message: "Remaining payment verified successfully. Prescription has been released to patient.",
    appointment: updatedAppointment,
  });
});
