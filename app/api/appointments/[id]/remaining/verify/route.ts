import { NextRequest, NextResponse } from "next/server";
import { db, appointments, payments } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { triggerAppointmentUpdate } from "@/lib/pusher";

/**
 * POST /api/appointments/[id]/remaining/verify
 * Doctor verifies remaining payment has been received and releases prescription
 *
 * Authorization: Doctor assigned to the appointment
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only doctors can verify payments
    if (session.user.role !== "DOCTOR" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only doctors can verify remaining payments" },
        { status: 403 }
      );
    }

    const { id: appointmentId } = await params;

    // Get appointment with prescription
    const appointment = await db.query.appointments.findFirst({
      where: eq(appointments.id, appointmentId),
      with: {
        patient: { with: { user: true } },
        prescription: {
          with: { medications: true },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Verify doctor is assigned to this appointment
    if (appointment.doctorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You are not authorized to verify this payment" },
        { status: 403 }
      );
    }

    // Check if this is a video consultation
    if (!appointment.isVideoConsultation) {
      return NextResponse.json(
        { error: "This is not a video consultation" },
        { status: 400 }
      );
    }

    // Check if appointment is completed
    if (appointment.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Appointment must be completed before verifying remaining payment" },
        { status: 400 }
      );
    }

    // Check if remaining payment has been confirmed by patient
    if (!appointment.remainingConfirmedAt) {
      return NextResponse.json(
        { error: "Patient has not confirmed remaining payment yet" },
        { status: 400 }
      );
    }

    // Check if already verified
    if (appointment.remainingPaid) {
      return NextResponse.json(
        { error: "Remaining payment already verified" },
        { status: 400 }
      );
    }

    const now = new Date();

    // Update appointment - release prescription
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

    // Update payment record for remaining payment
    const remainingPayment = await db.query.payments.findFirst({
      where: and(
        eq(payments.appointmentId, appointmentId),
        eq(payments.status, "PENDING")
      ),
    });

    if (remainingPayment) {
      await db
        .update(payments)
        .set({
          status: "PAID",
          paidAt: now,
          verifiedByDoctor: true,
          verifiedAt: now,
        })
        .where(eq(payments.id, remainingPayment.id));
    }

    // Trigger real-time update for patient
    triggerAppointmentUpdate({
      id: updatedAppointment.id,
      status: updatedAppointment.status,
      patientId: updatedAppointment.patientId,
    }).catch((err) =>
      console.error("Error triggering appointment update:", err)
    );

    // TODO: Send prescription email to patient
    // if (appointment.prescription) {
    //   await sendPrescriptionEmail({
    //     patientEmail: appointment.patient.user.email,
    //     patientName: appointment.patient.user.name,
    //     prescription: appointment.prescription,
    //   });
    // }

    // TODO: Send notification to patient about verified payment and released prescription
    // notifyPatientPrescriptionReleased(appointment.patient.userId, appointmentId)

    return NextResponse.json({
      success: true,
      message: "Remaining payment verified successfully. Prescription has been released to patient.",
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error("Error verifying remaining payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
