import { NextRequest, NextResponse } from "next/server";
import { db, users, doctorProfiles, doctorSchedule } from "@/lib/db";
import { eq, and, gte } from "drizzle-orm";

// Public endpoint to fetch doctors list (for registration page)
export async function GET(req: NextRequest) {
  try {
    // Get all doctors with their profiles (public info only)
    const doctors = await db
      .select({
        id: users.id,
        name: users.name,
        speciality: doctorProfiles.speciality,
        degrees: doctorProfiles.degrees,
        experience: doctorProfiles.experience,
        isTestAccount: doctorProfiles.isTestAccount,
      })
      .from(users)
      .innerJoin(doctorProfiles, eq(users.id, doctorProfiles.userId))
      .where(eq(users.role, "DOCTOR"));

    // Get today's date for checking availability
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check which doctors have upcoming schedules
    const doctorsWithAvailability = await Promise.all(
      doctors.map(async (doctor) => {
        const upcomingSchedule = await db.query.doctorSchedule.findFirst({
          where: and(
            eq(doctorSchedule.doctorId, doctor.id),
            gte(doctorSchedule.scheduleDate, today),
            eq(doctorSchedule.isActive, true),
          ),
        });

        return {
          ...doctor,
          hasAvailability: !!upcomingSchedule,
        };
      }),
    );

    return NextResponse.json({ doctors: doctorsWithAvailability });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
