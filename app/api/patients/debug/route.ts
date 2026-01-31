import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { users, patientProfiles, appointments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all users with PATIENT role
    const allUsers = await db.select().from(users).where(eq(users.role, "PATIENT"));

    // Get all patient profiles
    const allPatientProfiles = await db.select().from(patientProfiles);

    // Get all appointments
    const allAppointments = await db.select().from(appointments);

    // Try the relational query
    const patientsWithRelations = await db.query.patientProfiles.findMany({
      with: {
        user: true,
        appointments: true,
      },
    });

    return NextResponse.json({
      debug: {
        totalPatientUsers: allUsers.length,
        totalPatientProfiles: allPatientProfiles.length,
        totalAppointments: allAppointments.length,
        patientsWithRelations: patientsWithRelations.length,
        samplePatientProfile: allPatientProfiles[0],
        sampleAppointment: allAppointments[0],
        samplePatientWithRelations: patientsWithRelations[0],
      },
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json(
      { error: "Debug failed", details: String(error) },
      { status: 500 }
    );
  }
}
