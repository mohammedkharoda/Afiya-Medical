import { NextRequest, NextResponse } from "next/server";
import { db, users, patientProfiles, doctorProfiles } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/session";

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "PATIENT") {
      return NextResponse.json(
        { error: "Only patients can update preferred doctor" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const preferredDoctorId = body.preferredDoctorId || null;

    if (preferredDoctorId) {
      const doctor = await db.query.users.findFirst({
        where: and(eq(users.id, preferredDoctorId), eq(users.role, "DOCTOR")),
      });

      if (!doctor) {
        return NextResponse.json(
          { error: "Selected doctor is not valid" },
          { status: 400 },
        );
      }
    }

    const patientProfile = await db.query.patientProfiles.findFirst({
      where: eq(patientProfiles.userId, session.user.id),
    });

    if (!patientProfile) {
      return NextResponse.json(
        { error: "Patient profile not found" },
        { status: 404 },
      );
    }

    await db
      .update(patientProfiles)
      .set({ preferredDoctorId, updatedAt: new Date() })
      .where(eq(patientProfiles.id, patientProfile.id));

    let preferredDoctor = null;
    if (preferredDoctorId) {
      const doctor = await db
        .select({
          id: users.id,
          name: users.name,
          speciality: doctorProfiles.speciality,
        })
        .from(users)
        .innerJoin(doctorProfiles, eq(users.id, doctorProfiles.userId))
        .where(eq(users.id, preferredDoctorId))
        .limit(1);

      if (doctor.length > 0) {
        preferredDoctor = doctor[0];
      }
    }

    return NextResponse.json({ preferredDoctor });
  } catch (error) {
    console.error("Error updating preferred doctor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
