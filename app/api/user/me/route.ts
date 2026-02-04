import { NextRequest, NextResponse } from "next/server";
import { db, users, patientProfiles, doctorProfiles } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Session user:", session.user);

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        image: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    console.log("Database user:", user);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // For patients, fetch their preferred doctor information
    let preferredDoctor = null;
    if (user.role === "PATIENT") {
      const patientProfile = await db.query.patientProfiles.findFirst({
        where: eq(patientProfiles.userId, user.id),
        columns: {
          preferredDoctorId: true,
        },
      });

      if (patientProfile?.preferredDoctorId) {
        // Fetch the preferred doctor's details
        const doctor = await db
          .select({
            id: users.id,
            name: users.name,
            speciality: doctorProfiles.speciality,
          })
          .from(users)
          .innerJoin(doctorProfiles, eq(users.id, doctorProfiles.userId))
          .where(eq(users.id, patientProfile.preferredDoctorId))
          .limit(1);

        if (doctor.length > 0) {
          preferredDoctor = doctor[0];
        }
      }
    }

    // For doctors, fetch their profile including UPI info
    let doctorProfile = null;
    if (user.role === "DOCTOR") {
      const profile = await db.query.doctorProfiles.findFirst({
        where: eq(doctorProfiles.userId, user.id),
        columns: {
          speciality: true,
          degrees: true,
          experience: true,
          upiId: true,
          clinicAddress: true,
        },
      });

      if (profile) {
        doctorProfile = profile;
      }
    }

    return NextResponse.json({ user, preferredDoctor, doctorProfile });
  } catch (error) {
    console.error("Error fetching current user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
