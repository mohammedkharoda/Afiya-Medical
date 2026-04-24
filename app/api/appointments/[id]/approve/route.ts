import { NextRequest, NextResponse } from "next/server";
import { db, appointments, doctorProfiles } from "@/lib/db";
import { eq } from "drizzle-orm";
import {
  withAuth,
  requireRole,
  getAppointmentWithPatient,
  fireAppointmentUpdate,
  notFound,
  forbidden,
  badRequest,
} from "@/lib/api";
import { notifyPatientAppointmentApproved } from "@/lib/notifications";
import { format } from "date-fns";

export const POST = withAuth(async (req, session, { id: appointmentId }) => {
  const roleError = requireRole(session, "DOCTOR", "ADMIN");
  if (roleError) return roleError;

  let videoConsultationFee: number | null = null;
  try {
    const body = await req.json();
    if (body?.videoConsultationFee !== undefined) {
      videoConsultationFee = Number(body.videoConsultationFee);
    }
  } catch {
    // Non-video approvals can be submitted without a JSON body.
  }

  const appointment = await getAppointmentWithPatient(appointmentId);
  if (!appointment) return notFound("Appointment");

  if (appointment.status !== "PENDING") {
    return badRequest("Only pending appointments can be approved");
  }

  if (
    session.user.role !== "ADMIN" &&
    appointment.doctorId &&
    appointment.doctorId !== session.user.id
  ) {
    return forbidden("You are not authorized to approve this appointment");
  }

  const now = new Date();
  const updateData: Record<string, unknown> = {
    status: "SCHEDULED",
    approvedAt: now,
    approvedBy: session.user.id,
    updatedAt: now,
  };

  if (appointment.isVideoConsultation) {
    if (!Number.isFinite(videoConsultationFee) || (videoConsultationFee ?? 0) <= 0) {
      return badRequest("A valid video consultation amount is required");
    }

    const approvingDoctorId = appointment.doctorId || session.user.id;
    const doctorProfile = await db.query.doctorProfiles.findFirst({
      where: eq(doctorProfiles.userId, approvingDoctorId),
    });

    if (!doctorProfile?.upiId) {
      return badRequest("Doctor UPI details are required before approving video consultation");
    }

    const normalizedFee = Math.round((videoConsultationFee ?? 0) * 100) / 100;
    const depositAmount = Math.round(normalizedFee * 0.5 * 100) / 100;
    const remainingAmount = Math.round((normalizedFee - depositAmount) * 100) / 100;

    Object.assign(updateData, {
      videoConsultationFee: normalizedFee,
      depositAmount,
      depositPaid: false,
      depositConfirmedAt: null,
      depositVerifiedAt: null,
      depositPaymentScreenshot: null,
      depositCancellationScheduledAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      remainingAmount,
      remainingPaid: false,
      remainingConfirmedAt: null,
      remainingVerifiedAt: null,
      remainingPaymentScreenshot: null,
      prescriptionWithheld: true,
      paymentStatus: "PENDING",
    });
  }

  const [updatedAppointment] = await db
    .update(appointments)
    .set(updateData)
    .where(eq(appointments.id, appointmentId))
    .returning();

  const patientUserId = appointment.patient?.user?.id;
  if (patientUserId) {
    const doctorId = appointment.doctorId || session.user.id;
    notifyPatientAppointmentApproved(
      patientUserId,
      format(appointment.appointmentDate, "MMMM d, yyyy"),
      appointment.appointmentTime,
      doctorId,
    ).catch((err) => console.error("Error notifying patient of approval:", err));
  }

  fireAppointmentUpdate({
    id: updatedAppointment.id,
    status: updatedAppointment.status,
    patientId: updatedAppointment.patientId,
  });

  return NextResponse.json({
    success: true,
    message: "Appointment approved successfully",
    appointment: updatedAppointment,
  });
});
