import { NextRequest, NextResponse } from "next/server";
import { db, appointments } from "@/lib/db";
import { and, eq, lt, isNull } from "drizzle-orm";
import { triggerAppointmentUpdate } from "@/lib/pusher";

/**
 * GET /api/cron/cancel-unverified-deposits
 * Scheduled job to auto-cancel video consultation appointments with unverified deposits after 24 hours
 *
 * Authorization: Requires CRON_SECRET header
 *
 * This endpoint should be called by a cron service (e.g., Vercel Cron, GitHub Actions, or external cron service)
 * at regular intervals (e.g., every hour) to check for and cancel expired appointments.
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET not configured");
      return NextResponse.json(
        { error: "Cron secret not configured" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid cron secret" },
        { status: 401 }
      );
    }

    const now = new Date();

    // Find appointments with expired deposit confirmation (24 hours passed)
    const expiredAppointments = await db.query.appointments.findMany({
      where: and(
        eq(appointments.isVideoConsultation, true),
        eq(appointments.depositPaid, false),
        lt(appointments.depositCancellationScheduledAt, now)
      ),
      with: {
        patient: { with: { user: true } },
        doctor: true,
      },
    });

    console.log(`Found ${expiredAppointments.length} appointments with expired deposit confirmation`);

    // Cancel each appointment
    const cancelledAppointments = [];

    for (const appointment of expiredAppointments) {
      try {
        const [cancelledAppointment] = await db
          .update(appointments)
          .set({
            status: "CANCELLED",
            cancellationReason: "Deposit payment not verified within 24 hours",
            cancelledAt: now,
            cancelledBy: "system",
            updatedAt: now,
          })
          .where(eq(appointments.id, appointment.id))
          .returning();

        cancelledAppointments.push({
          id: cancelledAppointment.id,
          patientName: appointment.patient.user.name,
          doctorName: appointment.doctor?.name,
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.appointmentTime,
        });

        // Trigger real-time update
        triggerAppointmentUpdate({
          id: cancelledAppointment.id,
          status: cancelledAppointment.status,
          patientId: cancelledAppointment.patientId,
        }).catch((err) =>
          console.error("Error triggering appointment update:", err)
        );

        // TODO: Send notification to patient about cancellation
        // notifyPatientAppointmentCancelled(
        //   appointment.patient.userId,
        //   appointment.id,
        //   "Deposit payment not verified within 24 hours"
        // );

        // TODO: Send notification to doctor about cancellation
        // if (appointment.doctorId) {
        //   notifyDoctorAppointmentCancelled(
        //     appointment.doctorId,
        //     appointment.id,
        //     "Deposit payment not verified (auto-cancelled)"
        //   );
        // }

        console.log(`Cancelled appointment ${appointment.id} - deposit not verified`);
      } catch (error) {
        console.error(`Error cancelling appointment ${appointment.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Auto-cancelled ${cancelledAppointments.length} appointments with unverified deposits`,
      cancelled: cancelledAppointments.length,
      appointments: cancelledAppointments,
    });
  } catch (error) {
    console.error("Error in cancel-unverified-deposits cron job:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
