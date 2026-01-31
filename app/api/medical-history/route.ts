import { NextRequest, NextResponse } from "next/server";
import { db, patientProfiles, medicalHistory } from "@/lib/db";
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
      with: { medicalHistory: true },
    });

    if (!patientProfile) {
      return NextResponse.json({ medicalHistory: null });
    }

    return NextResponse.json({ medicalHistory: patientProfile.medicalHistory });
  } catch (error) {
    console.error("Error fetching medical history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    if (session.user.role !== "PATIENT") {
      return NextResponse.json(
        { error: "Only patients can submit medical history" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const {
      conditions,
      allergies,
      currentMedications,
      surgeries,
      familyHistory,
    } = body;

    // Check if patient profile exists, create one if not
    let patientProfile = await db.query.patientProfiles.findFirst({
      where: eq(patientProfiles.userId, session.user.id),
    });

    if (!patientProfile) {
      // Create a basic patient profile with placeholder data
      // The user can update this later
      const [newProfile] = await db
        .insert(patientProfiles)
        .values({
          userId: session.user.id,
          dob: new Date("1990-01-01"), // Placeholder
          gender: "OTHER",
          address: "Not provided",
          emergencyContact: "Not provided",
        })
        .returning();
      patientProfile = newProfile;
    }

    // Check if medical history already exists for this patient
    const existingMedicalHistory = await db.query.medicalHistory.findFirst({
      where: eq(medicalHistory.patientId, patientProfile.id),
    });

    let medicalHistoryRecord;

    if (existingMedicalHistory) {
      // Update existing medical history
      const [updatedRecord] = await db
        .update(medicalHistory)
        .set({
          conditions,
          allergies,
          currentMedications,
          surgeries,
          familyHistory,
          updatedAt: new Date(),
        })
        .where(eq(medicalHistory.id, existingMedicalHistory.id))
        .returning();
      medicalHistoryRecord = updatedRecord;
    } else {
      // Insert new medical history
      const [newRecord] = await db
        .insert(medicalHistory)
        .values({
          patientId: patientProfile.id,
          conditions,
          allergies,
          currentMedications,
          surgeries,
          familyHistory,
        })
        .returning();
      medicalHistoryRecord = newRecord;
    }

    // Update patient profile to mark medical history as completed
    await db
      .update(patientProfiles)
      .set({ hasCompletedMedicalHistory: true })
      .where(eq(patientProfiles.id, patientProfile.id));

    return NextResponse.json(
      { medicalHistory: medicalHistoryRecord },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating medical history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session || session.user.role !== "PATIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      conditions,
      allergies,
      currentMedications,
      surgeries,
      familyHistory,
    } = body;

    const patientProfile = await db.query.patientProfiles.findFirst({
      where: eq(patientProfiles.userId, session.user.id),
      with: { medicalHistory: true },
    });

    if (!patientProfile || !patientProfile.medicalHistory) {
      return NextResponse.json(
        { error: "Medical history not found" },
        { status: 404 },
      );
    }

    const [updatedMedicalHistory] = await db
      .update(medicalHistory)
      .set({
        conditions,
        allergies,
        currentMedications,
        surgeries,
        familyHistory,
      })
      .where(eq(medicalHistory.id, patientProfile.medicalHistory.id))
      .returning();

    return NextResponse.json({ medicalHistory: updatedMedicalHistory });
  } catch (error) {
    console.error("Error updating medical history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
