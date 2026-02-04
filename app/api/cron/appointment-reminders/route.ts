import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appointments, patientProfiles, users } from "@/lib/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";
import { sendAppointmentReminderEmail } from "@/lib/email";
import { getDoctorById } from "@/lib/doctor";
import {
  formatDateIST,
  formatTimeString,
  getCurrentIST,
  getStartOfDayIST,
  getEndOfDayIST,
} from "@/lib/date-utils";
import { CLINIC_NAME } from "@/lib/constants";

// This endpoint should be called every 15 minutes by an external cron service
// It will check for appointments starting in 10-40 minutes and send reminders
// This ensures reminders are sent approximately 30 minutes before

/**
 * Calculate minutes from midnight for a time string (HH:MM)
 */
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Allow requests with valid secret OR from Vercel cron
    const isVercelCron = req.headers.get("x-vercel-cron") === "1";

    if (cronSecret && !isVercelCron && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current IST time using proper utility
    const nowIST = getCurrentIST();
    const currentHours = nowIST.getHours();
    const currentMinutes = nowIST.getMinutes();
    const currentMinutesFromMidnight = currentHours * 60 + currentMinutes;

    const dateStr = `${nowIST.getFullYear()}-${String(nowIST.getMonth() + 1).padStart(2, "0")}-${String(nowIST.getDate()).padStart(2, "0")}`;
    const timeStr = `${String(currentHours).padStart(2, "0")}:${String(currentMinutes).padStart(2, "0")}`;

    console.log(`[Reminder CRON] Running at IST: ${dateStr} ${timeStr}`);
    console.log(
      `[Reminder CRON] Current minutes from midnight: ${currentMinutesFromMidnight}`,
    );

    // Get today's date range for query using proper IST boundaries
    const todayStart = getStartOfDayIST(new Date());
    const todayEnd = getEndOfDayIST(new Date());

    console.log(
      `[Reminder CRON] Query range (UTC): ${todayStart.toISOString()} to ${todayEnd.toISOString()}`,
    );

    // Find all scheduled appointments for today that haven't had reminders sent
    const scheduledAppointments = await db
      .select({
        id: appointments.id,
        appointmentDate: appointments.appointmentDate,
        appointmentTime: appointments.appointmentTime,
        status: appointments.status,
        reminderSent: appointments.reminderSent,
        patientId: appointments.patientId,
        doctorId: appointments.doctorId,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.status, "SCHEDULED"),
          eq(appointments.reminderSent, false),
          gte(appointments.appointmentDate, todayStart),
          lt(appointments.appointmentDate, todayEnd),
        ),
      );

    console.log(
      `[Reminder CRON] Found ${scheduledAppointments.length} appointments needing reminder check`,
    );

    let remindersSent = 0;
    const errors: string[] = [];

    for (const appointment of scheduledAppointments) {
      try {
        // Convert appointment time to minutes from midnight
        const appointmentMinutes = timeToMinutes(appointment.appointmentTime);

        // Calculate time difference in minutes
        const timeDiffMinutes = appointmentMinutes - currentMinutesFromMidnight;

        console.log(
          `[Reminder CRON] Appointment ${appointment.id}: ` +
            `time=${appointment.appointmentTime} (${appointmentMinutes} min), ` +
            `diff=${timeDiffMinutes} minutes`,
        );

        // Send reminder if appointment is 15-45 minutes away
        // This window ensures we catch it when cron runs every 15 minutes
        if (timeDiffMinutes >= 15 && timeDiffMinutes <= 45) {
          console.log(
            `[Reminder CRON] Sending reminder for appointment ${appointment.id}`,
          );

          // Get patient details
          const patientProfile = await db.query.patientProfiles.findFirst({
            where: eq(patientProfiles.id, appointment.patientId),
            with: {
              user: true,
            },
          });

          if (!patientProfile?.user?.email) {
            errors.push(`No email for appointment ${appointment.id}`);
            continue;
          }

          const doctor = appointment.doctorId
            ? await getDoctorById(appointment.doctorId)
            : null;

          // Send reminder email
          const emailSent = await sendAppointmentReminderEmail(
            patientProfile.user.email,
            patientProfile.user.name,
            formatDateIST(appointment.appointmentDate),
            formatTimeString(appointment.appointmentTime),
            doctor?.name || "Doctor",
            CLINIC_NAME,
            doctor?.clinicAddress || undefined,
          );

          if (emailSent) {
            // Mark reminder as sent
            await db
              .update(appointments)
              .set({ reminderSent: true })
              .where(eq(appointments.id, appointment.id));

            remindersSent++;
            console.log(
              `[Reminder CRON] Reminder sent for appointment ${appointment.id} to ${patientProfile.user.email}`,
            );
          } else {
            errors.push(
              `Failed to send email for appointment ${appointment.id}`,
            );
          }
        }
      } catch (error) {
        console.error(
          `[Reminder CRON] Error processing appointment ${appointment.id}:`,
          error,
        );
        errors.push(`Error for appointment ${appointment.id}: ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      currentTimeIST: `${dateStr} ${timeStr}`,
      remindersSent,
      totalChecked: scheduledAppointments.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("[Reminder CRON] Error in appointment reminder cron:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
