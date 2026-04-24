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

export const POST = withAuth(async (req, session, { id: appointmentId }) => {
  const body = await req.json();
  const { paymentScreenshot } = body;

  const appointment = await getAppointmentWithPatient(appointmentId);
  if (!appointment) return notFound("Appointment");

  if (appointment.patient.userId !== session.user.id) {
    return forbidden("Only the patient can confirm deposit payment");
  }

  if (!appointment.isVideoConsultation) {
    return badRequest("This is not a video consultation");
  }

  if (appointment.depositConfirmedAt) {
    return badRequest("Deposit payment already confirmed");
  }

  const [updatedAppointment] = await db
    .update(appointments)
    .set({
      depositConfirmedAt: new Date(),
      depositPaymentScreenshot: paymentScreenshot || appointment.depositPaymentScreenshot,
      updatedAt: new Date(),
    })
    .where(eq(appointments.id, appointmentId))
    .returning();

  fireAppointmentUpdate({
    id: updatedAppointment.id,
    status: updatedAppointment.status,
    patientId: updatedAppointment.patientId,
  });

  return NextResponse.json({
    success: true,
    message: "Deposit confirmation submitted successfully. Doctor will verify within 24 hours.",
    appointment: updatedAppointment,
  });
});
