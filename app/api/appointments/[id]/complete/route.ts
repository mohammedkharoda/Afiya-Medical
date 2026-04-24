import { NextRequest, NextResponse } from "next/server";
import { db, appointments, payments, users, doctorProfiles } from "@/lib/db";
import { eq } from "drizzle-orm";
import {
  withAuth,
  requireRole,
  getAppointmentWithPatient,
  fireAppointmentUpdate,
  notFound,
  badRequest,
} from "@/lib/api";
import { sendBillingEmail } from "@/lib/email";
import { format } from "date-fns";
import { notifyPatientAppointmentStatusChange } from "@/lib/notifications";

export const POST = withAuth(async (req, session, { id: appointmentId }) => {
  const roleError = requireRole(session, "DOCTOR", "ADMIN");
  if (roleError) return roleError;

  const { consultationFee, paymentMethod = "CASH", isPaid = false, notes } = await req.json();

  if (!consultationFee || consultationFee <= 0) {
    return badRequest("Valid consultation fee is required");
  }

  const appointment = await getAppointmentWithPatient(appointmentId);
  if (!appointment) return notFound("Appointment");

  if (appointment.status !== "SCHEDULED") {
    return badRequest("Only scheduled appointments can be completed");
  }

  const doctorId = appointment.doctorId || session.user.id;
  const [doctor, doctorProfile] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, doctorId) }),
    db.query.doctorProfiles.findFirst({ where: eq(doctorProfiles.userId, doctorId) }),
  ]);

  const isVideoConsultation = appointment.isVideoConsultation;

  await db
    .update(appointments)
    .set({ status: "COMPLETED", updatedAt: new Date() })
    .where(eq(appointments.id, appointmentId));

  let payment;

  if (isVideoConsultation) {
    [payment] = await db
      .insert(payments)
      .values({
        appointmentId,
        amount: appointment.remainingAmount || consultationFee * 0.5,
        paymentMethod: "UPI_MANUAL",
        status: "PENDING",
        notes: "Remaining payment (50%) for video consultation - Pay to doctor's UPI ID",
        verifiedByDoctor: false,
      })
      .returning();

    await db
      .update(appointments)
      .set({ paymentStatus: "PENDING", prescriptionWithheld: true, prescriptionSent: false, billSent: false })
      .where(eq(appointments.id, appointmentId));
  } else {
    [payment] = await db
      .insert(payments)
      .values({
        appointmentId,
        amount: consultationFee,
        paymentMethod,
        status: isPaid ? "PAID" : "PENDING",
        paidAt: isPaid ? new Date() : null,
        notes,
      })
      .returning();

    await db
      .update(appointments)
      .set({ paymentStatus: isPaid ? "PAID" : "PENDING", billSent: true, billSentAt: new Date() })
      .where(eq(appointments.id, appointmentId));
  }

  fireAppointmentUpdate({ id: appointmentId, status: "COMPLETED", patientId: appointment.patientId });

  const patientUserId = appointment.patient?.user?.id;
  if (patientUserId) {
    notifyPatientAppointmentStatusChange(
      patientUserId,
      "COMPLETED",
      format(new Date(appointment.appointmentDate), "MMMM d, yyyy"),
      appointment.appointmentTime,
      doctorId,
    ).catch((err) => console.error("Error notifying patient of completion:", err));
  }

  if (!isPaid && !isVideoConsultation && appointment.patient?.user?.email) {
    sendBillingEmail({
      patientEmail: appointment.patient.user.email,
      patientName: appointment.patient.user.name,
      patientPublicId: appointment.patient.publicId,
      doctorName: doctor?.name || "Doctor",
      doctorPublicId: doctorProfile?.publicId || undefined,
      doctorSpeciality: doctorProfile?.speciality || "General Physician",
      appointmentDate: format(new Date(appointment.appointmentDate), "dd MMM yyyy"),
      appointmentTime: appointment.appointmentTime,
      consultationFee,
      upiId: doctorProfile?.upiId || undefined,
      upiQrCode: doctorProfile?.upiQrCode || undefined,
      symptoms: appointment.symptoms,
      clinicAddress: doctorProfile?.clinicAddress || undefined,
    }).catch((err) => console.error("Error sending billing email:", err));
  }

  return NextResponse.json({
    success: true,
    appointment: { id: appointmentId, status: "COMPLETED" },
    payment,
  });
});
