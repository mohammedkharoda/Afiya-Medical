import { NextRequest, NextResponse } from "next/server";
import { db, appointments } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { triggerAppointmentUpdate } from "@/lib/pusher";

/**
 * POST /api/appointments/[id]/remaining/confirm
 * Patient confirms they have made the remaining payment (50% after consultation)
 *
 * Authorization: Patient who booked the appointment
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

    const { id: appointmentId } = await params;
    const body = await req.json();
    const { paymentScreenshot } = body; // Optional Cloudinary URL

    // Get appointment with patient details
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

    // Verify user is the patient
    if (appointment.patient.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the patient can confirm remaining payment" },
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
        { error: "Appointment must be completed before remaining payment" },
        { status: 400 }
      );
    }

    // Check if remaining payment already confirmed
    if (appointment.remainingConfirmedAt) {
      return NextResponse.json(
        { error: "Remaining payment already confirmed" },
        { status: 400 }
      );
    }

    // Update appointment with confirmation timestamp
    const [updatedAppointment] = await db
      .update(appointments)
      .set({
        remainingConfirmedAt: new Date(),
        remainingPaymentScreenshot: paymentScreenshot || appointment.remainingPaymentScreenshot,
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, appointmentId))
      .returning();

    // Trigger real-time update for doctor
    triggerAppointmentUpdate({
      id: updatedAppointment.id,
      status: updatedAppointment.status,
      patientId: updatedAppointment.patientId,
    }).catch((err) =>
      console.error("Error triggering appointment update:", err)
    );

    // TODO: Send notification to doctor about pending verification
    // notifyDoctorRemainingPaymentConfirmation(appointment.doctorId, appointmentId)

    return NextResponse.json({
      success: true,
      message: "Remaining payment confirmation submitted successfully. Doctor will verify and release your prescription.",
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error("Error confirming remaining payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
