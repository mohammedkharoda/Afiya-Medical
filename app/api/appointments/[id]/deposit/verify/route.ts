import { NextRequest, NextResponse } from "next/server";
import { db, appointments, payments } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { triggerAppointmentUpdate } from "@/lib/pusher";

/**
 * POST /api/appointments/[id]/deposit/verify
 * Doctor verifies that deposit payment has been received
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
        { error: "Only doctors can verify deposit payments" },
        { status: 403 }
      );
    }

    const { id: appointmentId } = await params;

    // Get appointment
    const appointment = await db.query.appointments.findFirst({
      where: eq(appointments.id, appointmentId),
      with: {
        patient: { with: { user: true } },
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

    // Check if deposit has been confirmed by patient
    if (!appointment.depositConfirmedAt) {
      return NextResponse.json(
        { error: "Patient has not confirmed deposit payment yet" },
        { status: 400 }
      );
    }

    // Check if already verified
    if (appointment.depositPaid) {
      return NextResponse.json(
        { error: "Deposit payment already verified" },
        { status: 400 }
      );
    }

    const now = new Date();

    // Update appointment deposit status
    const [updatedAppointment] = await db
      .update(appointments)
      .set({
        depositPaid: true,
        depositVerifiedAt: now,
        depositCancellationScheduledAt: null, // Cancel auto-cancellation
        updatedAt: now,
      })
      .where(eq(appointments.id, appointmentId))
      .returning();

    // Update payment record (if exists)
    // Find the deposit payment record
    const depositPayment = await db.query.payments.findFirst({
      where: and(
        eq(payments.appointmentId, appointmentId),
        eq(payments.status, "PENDING")
      ),
    });

    if (depositPayment) {
      await db
        .update(payments)
        .set({
          status: "PAID",
          paidAt: now,
          verifiedByDoctor: true,
          verifiedAt: now,
        })
        .where(eq(payments.id, depositPayment.id));
    }

    // Trigger real-time update for patient
    triggerAppointmentUpdate({
      id: updatedAppointment.id,
      status: updatedAppointment.status,
      patientId: updatedAppointment.patientId,
    }).catch((err) =>
      console.error("Error triggering appointment update:", err)
    );

    // TODO: Send notification to patient about verified deposit
    // notifyPatientDepositVerified(appointment.patient.userId, appointmentId)

    return NextResponse.json({
      success: true,
      message: "Deposit payment verified successfully",
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error("Error verifying deposit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
