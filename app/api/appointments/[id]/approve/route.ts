import { NextRequest, NextResponse } from "next/server";
import { db, appointments } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { triggerAppointmentUpdate } from "@/lib/pusher";
import { notifyPatientAppointmentApproved } from "@/lib/notifications";
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

    // Only doctors and admins can approve appointments
    if (session.user.role !== "DOCTOR" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only doctors can approve appointments" },
        { status: 403 },
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
        { error: "Only pending appointments can be approved" },
        { status: 400 },
      );
    }

    // Update appointment to approved (SCHEDULED)
    const [updatedAppointment] = await db
      .update(appointments)
      .set({
        status: "SCHEDULED",
        approvedAt: new Date(),
        approvedBy: session.user.id,
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, appointmentId))
      .returning();

    // Send notification to patient (pass doctorId for correct doctor info in email)
    const patientUserId = appointment.patient?.user?.id;
    if (patientUserId) {
      const formattedDate = format(appointment.appointmentDate, "MMMM d, yyyy");
      // Use appointment's assigned doctor or the approving doctor
      const doctorId = appointment.doctorId || session.user.id;

      notifyPatientAppointmentApproved(
        patientUserId,
        formattedDate,
        appointment.appointmentTime,
        doctorId,
      ).catch((err) =>
        console.error("Error notifying patient of approval:", err),
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
      message: "Appointment approved successfully",
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error("Error approving appointment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
