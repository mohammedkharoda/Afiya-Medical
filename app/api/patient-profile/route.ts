import { NextRequest, NextResponse } from "next/server";
import { db, patientProfiles } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const patientProfile = await db.query.patientProfiles.findFirst({
      where: eq(patientProfiles.userId, session.user.id),
    });

    if (!patientProfile) {
      return NextResponse.json({
        profile: null,
        hasCompletedMedicalHistory: false,
      });
    }

    return NextResponse.json({
      profile: {
        id: patientProfile.id,
        dob: patientProfile.dob,
        gender: patientProfile.gender,
        bloodGroup: patientProfile.bloodGroup,
        address: patientProfile.address,
        emergencyContact: patientProfile.emergencyContact,
        hasCompletedMedicalHistory: patientProfile.hasCompletedMedicalHistory,
        createdAt: patientProfile.createdAt,
        updatedAt: patientProfile.updatedAt,
      },
      hasCompletedMedicalHistory: patientProfile.hasCompletedMedicalHistory,
    });
  } catch (error) {
    console.error("Error fetching patient profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
