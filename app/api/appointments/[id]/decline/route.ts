import { NextRequest, NextResponse } from "next/server";
import { db, appointments } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { triggerAppointmentUpdate } from "@/lib/pusher";
import { notifyPatientAppointmentDeclined } from "@/lib/notifications";
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

    // Only doctors and admins can decline appointments
    if (session.user.role !== "DOCTOR" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only doctors can decline appointments" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { reason } = body;

    // Validate reason
    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { error: "Decline reason must be at least 10 characters" },
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

    // Check if appointment is pending
    if (appointment.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending appointments can be declined" },
        { status: 400 },
      );
    }

    // Update appointment to declined
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

    // Send notification to patient
    const patientUserId = appointment.patient?.user?.id;
    if (patientUserId) {
      const formattedDate = format(appointment.appointmentDate, "MMMM d, yyyy");

      notifyPatientAppointmentDeclined(
        patientUserId,
        formattedDate,
        appointment.appointmentTime,
        reason.trim(),
      ).catch((err) =>
        console.error("Error notifying patient of decline:", err),
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
      message: "Appointment declined",
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error("Error declining appointment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
