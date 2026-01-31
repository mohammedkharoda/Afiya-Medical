import { NextRequest, NextResponse } from "next/server";
import { db, patientProfiles, payments, appointments } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, id: userId } = session.user;
    const normalizedRole = role?.toUpperCase();

    let paymentsList;

    if (normalizedRole === "PATIENT") {
      const patientProfile = await db.query.patientProfiles.findFirst({
        where: eq(patientProfiles.userId, userId),
      });

      if (!patientProfile) {
        return NextResponse.json({ payments: [] });
      }

      paymentsList = await db.query.payments.findMany({
        with: {
          appointment: true,
        },
        orderBy: [desc(payments.createdAt)],
      });

      // Filter payments for patient's appointments
      paymentsList = paymentsList.filter(
        (p) => p.appointment.patientId === patientProfile.id,
      );
    } else if (normalizedRole === "DOCTOR" || normalizedRole === "ADMIN") {
      paymentsList = await db.query.payments.findMany({
        with: {
          appointment: {
            with: {
              patient: {
                with: {
                  user: true,
                },
              },
            },
          },
        },
        orderBy: [desc(payments.createdAt)],
      });
    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 403 });
    }

    return NextResponse.json({ payments: paymentsList });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const normalizedRole = session.user.role?.toUpperCase();

    // Only doctors and admins can record payments
    if (normalizedRole !== "DOCTOR" && normalizedRole !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { appointmentId, amount, paymentMethod, notes, isPaid } = body;

    const [payment] = await db
      .insert(payments)
      .values({
        appointmentId,
        amount,
        paymentMethod: paymentMethod || "CASH",
        notes,
        status: isPaid !== false ? "PAID" : "PENDING",
        paidAt: isPaid !== false ? new Date() : null,
      })
      .returning();

    // Update appointment payment status to PAID
    if (isPaid !== false) {
      await db
        .update(appointments)
        .set({ paymentStatus: "PAID" })
        .where(eq(appointments.id, appointmentId));
    }

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession(req);

    const normalizedRole = session?.user?.role?.toUpperCase();

    if (
      !session ||
      (normalizedRole !== "DOCTOR" && normalizedRole !== "ADMIN")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { paymentId, status } = body;

    const [payment] = await db
      .update(payments)
      .set({
        status,
        paidAt: status === "PAID" ? new Date() : null,
      })
      .where(eq(payments.id, paymentId))
      .returning();

    // Update appointment payment status
    await db
      .update(appointments)
      .set({ paymentStatus: status })
      .where(eq(appointments.id, payment.appointmentId));

    return NextResponse.json({ payment });
  } catch (error) {
    console.error("Error updating payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
