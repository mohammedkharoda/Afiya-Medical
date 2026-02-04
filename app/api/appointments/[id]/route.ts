import { NextRequest, NextResponse } from "next/server";
import { db, appointments } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { notifyPatientAppointmentStatusChange } from "@/lib/notifications";
import { format } from "date-fns";
import { triggerAppointmentUpdate } from "@/lib/pusher";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appointment = await db.query.appointments.findFirst({
      where: eq(appointments.id, id),
      with: {
        patient: {
          with: {
            user: true,
            medicalHistory: true,
          },
        },
        prescription: {
          with: { medications: true },
        },
        payment: true,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSession(req);

    if (
      !session ||
      (session.user.role !== "DOCTOR" && session.user.role !== "ADMIN")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { status, notes, appointmentDate, appointmentTime } = body;

    // Get the appointment with patient info before updating
    const existingAppointment = await db.query.appointments.findFirst({
      where: eq(appointments.id, id),
      with: {
        patient: {
          with: { user: true },
        },
      },
    });

    if (!existingAppointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 },
      );
    }

    // Build update object dynamically
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (status !== undefined) {
      updateData.status = status;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    if (appointmentDate !== undefined) {
      updateData.appointmentDate = new Date(appointmentDate);
    }
    if (appointmentTime !== undefined) {
      updateData.appointmentTime = appointmentTime;
    }

    // If date or time is being changed and no explicit status was provided, set status to RESCHEDULED
    if (
      (appointmentDate !== undefined || appointmentTime !== undefined) &&
      status === undefined
    ) {
      updateData.status = "RESCHEDULED";
    }

    const [appointment] = await db
      .update(appointments)
      .set(updateData)
      .where(eq(appointments.id, id))
      .returning();

    // Send notification to patient about changes
    const patientUserId = existingAppointment.patient?.user?.id;
    const isRescheduled = appointmentDate || appointmentTime;
    const isStatusChanged = status && status !== existingAppointment.status;

    if (patientUserId && (isStatusChanged || isRescheduled)) {
      const newDate = appointmentDate
        ? format(new Date(appointmentDate), "MMMM d, yyyy")
        : format(existingAppointment.appointmentDate, "MMMM d, yyyy");
      const newTime = appointmentTime || existingAppointment.appointmentTime;

      const doctorId =
        existingAppointment.doctorId ||
        existingAppointment.approvedBy ||
        undefined;

      if (isRescheduled) {
        // Notify about reschedule
        notifyPatientAppointmentStatusChange(
          patientUserId,
          "RESCHEDULED",
          newDate,
          newTime,
          doctorId,
        ).catch((err) =>
          console.error("Error notifying patient of reschedule:", err),
        );
      } else if (isStatusChanged) {
        // Notify about status change
        notifyPatientAppointmentStatusChange(
          patientUserId,
          status,
          newDate,
          newTime,
          doctorId,
        ).catch((err) =>
          console.error("Error notifying patient of status change:", err),
        );
      }

      // Trigger real-time update via Pusher
      triggerAppointmentUpdate({
        id: appointment.id,
        status: appointment.status,
        patientId: appointment.patientId,
      }).catch((err) =>
        console.error("Error triggering appointment update:", err),
      );
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db
      .update(appointments)
      .set({ status: "CANCELLED" })
      .where(eq(appointments.id, id));

    return NextResponse.json({ message: "Appointment cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
