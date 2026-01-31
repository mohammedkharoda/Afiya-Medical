import { NextRequest, NextResponse } from "next/server";
import { db, doctorSchedule, appointments } from "@/lib/db";
import { eq, and, ne, gte, lt } from "drizzle-orm";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);

    console.log("Available slots - Session:", session ? "Found" : "Not found");
    console.log("Available slots - User:", session?.user?.id);

    if (!session) {
      console.log("Available slots - No session, returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    console.log("Available slots - Date requested:", date);

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    // Parse the date - use local timezone to match how appointments are stored
    const [year, month, day] = date.split("-").map(Number);
    // Create dates in local timezone for comparison
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    console.log("Available slots - Start of day:", startOfDay.toISOString());
    console.log("Available slots - End of day:", endOfDay.toISOString());

    // Get doctor schedule for the specific date using range query
    const schedule = await db.query.doctorSchedule.findFirst({
      where: and(
        gte(doctorSchedule.scheduleDate, startOfDay),
        lt(
          doctorSchedule.scheduleDate,
          new Date(year, month - 1, day + 1, 0, 0, 0, 0),
        ),
        eq(doctorSchedule.isActive, true),
      ),
    });

    console.log("Available slots - Schedule found:", schedule);

    if (!schedule) {
      console.log("Available slots - No schedule set for this date");
      return NextResponse.json({
        slots: [],
        message:
          "Doctor has not set any appointments for this date. Please select another date.",
      });
    }

    // Get existing appointments for the date - include ALL statuses except CANCELLED
    const existingAppointments = await db
      .select({
        appointmentTime: appointments.appointmentTime,
        status: appointments.status,
        appointmentDate: appointments.appointmentDate,
      })
      .from(appointments)
      .where(
        and(
          gte(appointments.appointmentDate, startOfDay),
          lt(
            appointments.appointmentDate,
            new Date(year, month - 1, day + 1, 0, 0, 0, 0),
          ),
          ne(appointments.status, "CANCELLED"),
        ),
      );

    console.log(
      "Available slots - Existing appointments:",
      existingAppointments,
    );

    const bookedTimes = new Set(
      existingAppointments.map(
        (apt: { appointmentTime: string }) => apt.appointmentTime,
      ),
    );

    // Generate time slots
    const slots: string[] = [];
    const [startHour, startMin] = schedule.startTime.split(":").map(Number);
    const [endHour, endMin] = schedule.endTime.split(":").map(Number);

    // Parse break times if they exist
    let breakStart = 0;
    let breakEnd = 0;
    if (schedule.breakStartTime && schedule.breakEndTime) {
      const [breakStartHour, breakStartMin] = schedule.breakStartTime
        .split(":")
        .map(Number);
      const [breakEndHour, breakEndMin] = schedule.breakEndTime
        .split(":")
        .map(Number);
      breakStart = breakStartHour * 60 + breakStartMin;
      breakEnd = breakEndHour * 60 + breakEndMin;
    }

    // Check if the requested date is today
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const isToday = date === todayStr;
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

    console.log("Available slots - Is today:", isToday);
    console.log("Available slots - Current time in minutes:", currentTimeInMinutes);

    let currentTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    console.log(
      "Available slots - Start time:",
      schedule.startTime,
      "End time:",
      schedule.endTime,
    );
    console.log(
      "Available slots - Break time:",
      schedule.breakStartTime,
      "-",
      schedule.breakEndTime,
    );
    console.log("Available slots - Slot duration:", schedule.slotDuration);

    while (currentTime < endTime) {
      const hour = Math.floor(currentTime / 60);
      const min = currentTime % 60;
      const timeStr = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;

      // Check if slot is during break time
      const isBreakTime =
        breakStart > 0 &&
        breakEnd > 0 &&
        currentTime >= breakStart &&
        currentTime < breakEnd;

      // Check if slot time has already passed (for today only)
      const isSlotPassed = isToday && currentTime <= currentTimeInMinutes;

      if (!bookedTimes.has(timeStr) && !isBreakTime && !isSlotPassed) {
        slots.push(timeStr);
      }

      currentTime += schedule.slotDuration;
    }

    console.log("Available slots - Generated slots count:", slots.length);
    console.log("Available slots - First 5 slots:", slots.slice(0, 5));
    console.log("Available slots - Booked times:", Array.from(bookedTimes));

    // If today and no slots available, return special message
    if (isToday && slots.length === 0) {
      return NextResponse.json({
        slots: [],
        message: "Doctor has closed for today. Please book for the next available date.",
        closedForToday: true,
      });
    }

    return NextResponse.json({ slots });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
