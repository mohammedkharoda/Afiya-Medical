import { NextRequest, NextResponse } from "next/server";
import { db, doctorSchedule } from "@/lib/db";
import { eq, asc, gte, lt, and, or, isNull } from "drizzle-orm";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get schedules from today onwards
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const userId = session.user.id;
    const role = session.user.role;

    let schedule;

    if (role === "DOCTOR") {
      // Doctors only see their own schedules
      schedule = await db.query.doctorSchedule.findMany({
        where: and(
          gte(doctorSchedule.scheduleDate, today),
          eq(doctorSchedule.isActive, true),
          eq(doctorSchedule.doctorId, userId),
        ),
        orderBy: [asc(doctorSchedule.scheduleDate)],
      });
    } else {
      // Admins and patients see all active schedules
      schedule = await db.query.doctorSchedule.findMany({
        where: and(
          gte(doctorSchedule.scheduleDate, today),
          eq(doctorSchedule.isActive, true),
        ),
        orderBy: [asc(doctorSchedule.scheduleDate)],
      });
    }

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (
      !session ||
      (session.user.role !== "DOCTOR" && session.user.role !== "ADMIN")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      scheduleDate,
      startTime,
      endTime,
      breakStartTime,
      breakEndTime,
      slotDuration,
      maxPatientsPerSlot,
      isActive = true,
    } = body;

    if (!scheduleDate) {
      return NextResponse.json(
        { error: "Schedule date is required" },
        { status: 400 },
      );
    }

    // Parse the date using UTC to avoid timezone issues
    const [year, month, day] = scheduleDate.split("-").map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const nextDay = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0));

    console.log("Saving schedule for date:", parsedDate.toISOString());

    const userId = session.user.id;

    // Check if schedule for this date already exists for this doctor (using range query)
    const existingSchedule = await db.query.doctorSchedule.findFirst({
      where: and(
        gte(doctorSchedule.scheduleDate, parsedDate),
        lt(doctorSchedule.scheduleDate, nextDay),
        or(
          eq(doctorSchedule.doctorId, userId),
          isNull(doctorSchedule.doctorId),
        ),
      ),
    });

    let schedule;

    if (existingSchedule) {
      // Update existing schedule and assign to this doctor if not already assigned
      [schedule] = await db
        .update(doctorSchedule)
        .set({
          doctorId: userId, // Assign to this doctor
          startTime,
          endTime,
          breakStartTime: breakStartTime || null,
          breakEndTime: breakEndTime || null,
          slotDuration,
          maxPatientsPerSlot,
          isActive,
          updatedAt: new Date(),
        })
        .where(eq(doctorSchedule.id, existingSchedule.id))
        .returning();
    } else {
      // Create new schedule with doctorId
      [schedule] = await db
        .insert(doctorSchedule)
        .values({
          doctorId: userId, // Assign to this doctor
          scheduleDate: parsedDate,
          startTime,
          endTime,
          breakStartTime: breakStartTime || null,
          breakEndTime: breakEndTime || null,
          slotDuration,
          maxPatientsPerSlot,
          isActive,
        })
        .returning();
    }

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error("Error updating schedule:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (
      !session ||
      (session.user.role !== "DOCTOR" && session.user.role !== "ADMIN")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const scheduleId = searchParams.get("id");

    if (!scheduleId) {
      return NextResponse.json(
        { error: "Schedule ID is required" },
        { status: 400 },
      );
    }

    const userId = session.user.id;
    const role = session.user.role;

    // For doctors, verify they own this schedule
    if (role === "DOCTOR") {
      const existingSchedule = await db.query.doctorSchedule.findFirst({
        where: eq(doctorSchedule.id, scheduleId),
      });

      if (
        existingSchedule &&
        existingSchedule.doctorId &&
        existingSchedule.doctorId !== userId
      ) {
        return NextResponse.json(
          { error: "You can only delete your own schedules" },
          { status: 403 },
        );
      }
    }

    // Soft delete by setting isActive to false
    await db
      .update(doctorSchedule)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(doctorSchedule.id, scheduleId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
