import { NextRequest, NextResponse } from "next/server";
import { db, appointments } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { triggerAppointmentUpdate } from "@/lib/pusher";
import {
  notifyPatientAppointmentStatusChange,
  notifyDoctorAppointmentCancelledByPatient,
} from "@/lib/notifications";
import { format } from "date-fns";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { reason } = body;

    // Validate reason
    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { error: "Cancellation reason must be at least 10 characters" },
        { status: 400 },
      );
    }

    const { id: appointmentId } = await params;

    // Get the appointment with patient info
    const appointment = await db.query.appointments.findFirst({
      where: eq(appointments.id, appointmentId),
      with: {
        patient: {
          with: { user: true },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 },
      );
    }

    // Check authorization
    const isDoctor =
      session.user.role === "DOCTOR" || session.user.role === "ADMIN";
    const isPatientOwner = appointment.patient.userId === session.user.id;

    if (!isDoctor && !isPatientOwner) {
      return NextResponse.json(
        { error: "You are not authorized to cancel this appointment" },
        { status: 403 },
      );
    }

    // Check if appointment can be cancelled (both SCHEDULED and RESCHEDULED appointments)
    if (
      appointment.status !== "SCHEDULED" &&
      appointment.status !== "RESCHEDULED"
    ) {
      return NextResponse.json(
        {
          error: "Only scheduled or rescheduled appointments can be cancelled",
        },
        { status: 400 },
      );
    }

    // Update appointment
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

    // Send notification to the patient (if cancelled by doctor)
    const patientUserId = appointment.patient?.user?.id;
    if (isDoctor && patientUserId) {
      // Notify patient about cancellation
      notifyPatientAppointmentStatusChange(
        patientUserId,
        "CANCELLED",
        formattedDate,
        appointment.appointmentTime,
        appointment.doctorId || undefined,
      ).catch((err) =>
        console.error("Error notifying patient of cancellation:", err),
      );
    }

    // Send notification to the doctor (if cancelled by patient)
    if (!isDoctor && isPatientOwner) {
      notifyDoctorAppointmentCancelledByPatient(
        session.user.id,
        formattedDate,
        appointment.appointmentTime,
        reason.trim(),
        appointment.doctorId || undefined,
      ).catch((err) =>
        console.error("Error notifying doctor of patient cancellation:", err),
      );
    }

    // Trigger real-time update via Pusher
    triggerAppointmentUpdate({
      id: updatedAppointment.id,
      status: updatedAppointment.status,
      patientId: updatedAppointment.patientId,
    }).catch((err) =>
      console.error("Error triggering appointment update:", err),
    );

    return NextResponse.json({
      success: true,
      message: "Appointment cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
