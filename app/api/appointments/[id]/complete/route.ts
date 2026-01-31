import { NextRequest, NextResponse } from "next/server";
import { db, appointments, payments } from "@/lib/db";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only doctors and admins can complete appointments
    if (session.user.role !== "DOCTOR" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only doctors can complete appointments" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const {
      consultationFee,
      paymentMethod = "CASH",
      isPaid = false,
      notes,
    } = body;

    if (!consultationFee || consultationFee <= 0) {
      return NextResponse.json(
        { error: "Valid consultation fee is required" },
        { status: 400 },
      );
    }

    const { id: appointmentId } = await params;

    // Get the appointment
    const appointment = await db.query.appointments.findFirst({
      where: eq(appointments.id, appointmentId),
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 },
      );
    }

    if (appointment.status !== "SCHEDULED") {
      return NextResponse.json(
        { error: "Only scheduled appointments can be completed" },
        { status: 400 },
      );
    }

    // Update appointment status to COMPLETED
    await db
      .update(appointments)
      .set({
        status: "COMPLETED",
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, appointmentId));

    // Create payment record
    const [payment] = await db
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

    // Update appointment payment status
    await db
      .update(appointments)
      .set({
        paymentStatus: isPaid ? "PAID" : "PENDING",
      })
      .where(eq(appointments.id, appointmentId));

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointmentId,
        status: "COMPLETED",
      },
      payment,
    });
  } catch (error) {
    console.error("Error completing appointment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
