import { NextRequest, NextResponse } from "next/server";
import { db, appointments } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { notifyPatientAppointmentStatusChange } from "@/lib/notifications";
import { triggerAppointmentUpdate } from "@/lib/pusher";
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

    // Only doctors and admins can reschedule
    if (session.user.role !== "DOCTOR" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only doctors can reschedule appointments" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { newDate, newTime, reason } = body;

    if (!newDate || !newTime) {
      return NextResponse.json(
        { error: "New date and time are required" },
        { status: 400 },
      );
    }

    const { id: appointmentId } = await params;
    const newAppointmentDate = new Date(newDate);

    // Validate that new date is in the future
    if (newAppointmentDate < new Date()) {
      return NextResponse.json(
        { error: "Cannot reschedule to a past date" },
        { status: 400 },
      );
    }

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

    if (appointment.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Cannot reschedule a cancelled appointment" },
        { status: 400 },
      );
    }

    // Check if the new slot is already booked (exclude current appointment)
    const conflictingAppointment = await db.query.appointments.findFirst({
      where: and(
        eq(appointments.appointmentDate, newAppointmentDate),
        eq(appointments.appointmentTime, newTime),
      ),
    });

    if (
      conflictingAppointment &&
      conflictingAppointment.id !== appointmentId &&
      (conflictingAppointment.status === "SCHEDULED" ||
        conflictingAppointment.status === "RESCHEDULED")
    ) {
      return NextResponse.json(
        { error: "The selected time slot is already booked" },
        { status: 400 },
      );
    }

    // Store original date/time if not already rescheduled
    const originalDate =
      appointment.originalAppointmentDate || appointment.appointmentDate;
    const originalTime =
      appointment.originalAppointmentTime || appointment.appointmentTime;

    // Update appointment
    const [updatedAppointment] = await db
      .update(appointments)
      .set({
        appointmentDate: newAppointmentDate,
        appointmentTime: newTime,
        status: "RESCHEDULED",
        originalAppointmentDate: originalDate,
        originalAppointmentTime: originalTime,
        rescheduledBy: session.user.id,
        rescheduledAt: new Date(),
        notes: reason
          ? `${appointment.notes || ""}\nReschedule reason: ${reason}`.trim()
          : appointment.notes,
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, appointmentId))
      .returning();

    // Send notification to patient about rescheduling
    const patientUserId = appointment.patient?.user?.id;
    if (patientUserId) {
      const formattedDate = format(newAppointmentDate, "MMMM d, yyyy");

      // Send push/email notification
      notifyPatientAppointmentStatusChange(
        patientUserId,
        "RESCHEDULED",
        formattedDate,
        newTime,
        appointment.doctorId || undefined,
      ).catch((err) =>
        console.error("Error notifying patient of reschedule:", err),
      );

      // Trigger real-time update via Pusher
      triggerAppointmentUpdate({
        id: updatedAppointment.id,
        status: updatedAppointment.status,
        patientId: updatedAppointment.patientId,
      }).catch((err) =>
        console.error("Error triggering appointment update:", err),
      );
    }

    return NextResponse.json({
      success: true,
      message: "Appointment rescheduled successfully",
      appointment: {
        id: appointmentId,
        appointmentDate: newAppointmentDate,
        appointmentTime: newTime,
        status: "RESCHEDULED",
      },
    });
  } catch (error) {
    console.error("Error rescheduling appointment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
