import { NextRequest, NextResponse } from "next/server";
import { db, doctorSchedule, appointments } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

// Helper function to generate time slots
function generateTimeSlots(
  startTime: string,
  endTime: string,
  slotDuration: number,
): string[] {
  const slots: string[] = [];
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  let currentMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  while (currentMinutes < endMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const minutes = currentMinutes % 60;
    const timeSlot = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    slots.push(timeSlot);
    currentMinutes += slotDuration;
  }

  return slots;
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");

    if (!dateParam) {
      return NextResponse.json(
        { error: "Date parameter is required" },
        { status: 400 },
      );
    }

    const targetDate = new Date(dateParam);
    // Set time to start of day for date comparison
    targetDate.setHours(0, 0, 0, 0);

    // Get schedule for this specific date
    const schedule = await db.query.doctorSchedule.findFirst({
      where: and(
        eq(doctorSchedule.scheduleDate, targetDate),
        eq(doctorSchedule.isActive, true),
      ),
    });

    if (!schedule) {
      return NextResponse.json({
        availableSlots: [],
        message: "No schedule available for this day",
      });
    }

    // Generate all possible slots
    const allSlots = generateTimeSlots(
      schedule.startTime,
      schedule.endTime,
      schedule.slotDuration,
    );

    // Get booked appointments for this date
    const bookedAppointments = await db.query.appointments.findMany({
      where: and(
        eq(appointments.appointmentDate, targetDate),
        eq(appointments.status, "SCHEDULED"),
      ),
    });

    // Count bookings per slot
    const slotBookingCount = new Map<string, number>();
    bookedAppointments.forEach((apt) => {
      const count = slotBookingCount.get(apt.appointmentTime) || 0;
      slotBookingCount.set(apt.appointmentTime, count + 1);
    });

    // Filter available slots
    const now = new Date();
    const isToday = targetDate.toDateString() === now.toDateString();

    const availableSlots = allSlots.filter((slot) => {
      // Remove past slots if date is today
      if (isToday) {
        const [hours, minutes] = slot.split(":").map(Number);
        const slotTime = new Date(targetDate);
        slotTime.setHours(hours, minutes, 0, 0);
        if (slotTime <= now) {
          return false;
        }
      }

      // Remove fully booked slots
      const bookingCount = slotBookingCount.get(slot) || 0;
      return bookingCount < schedule.maxPatientsPerSlot;
    });

    return NextResponse.json({
      availableSlots,
      schedule: {
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        slotDuration: schedule.slotDuration,
      },
    });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
