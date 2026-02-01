import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db, appointments, patientProfiles, medicalHistory } from "@/lib/db";
import { eq } from "drizzle-orm";
import { medicationSuggestionRequestSchema } from "@/lib/validations/ai-suggestions";
import {
  generateMedicationSuggestions,
  MEDICATION_DISCLAIMER,
  type PatientContext,
} from "@/lib/ai/gemini";

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const session = await getSession(req);

    // Debug logging
    console.log("[AI Medication] Session check:", {
      hasSession: !!session,
      userRole: session?.user?.role,
      userId: session?.user?.id,
      sessionToken: req.cookies.get("better-auth.session_token")?.value
        ? "present"
        : "missing",
    });

    // Only doctors and admins can access AI medication suggestions
    if (
      !session ||
      (session.user.role?.toUpperCase() !== "DOCTOR" &&
        session.user.role?.toUpperCase() !== "ADMIN")
    ) {
      console.log("[AI Medication] Unauthorized - role:", session?.user?.role);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate input
    const validationResult = medicationSuggestionRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.issues },
        { status: 400 },
      );
    }

    const { diagnosis, appointmentId, existingMedications, symptoms } =
      validationResult.data;

    // Fetch appointment to get patient ID
    const appointment = await db.query.appointments.findFirst({
      where: eq(appointments.id, appointmentId),
      columns: { patientId: true },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 },
      );
    }

    // Fetch patient context
    let patientContext: PatientContext | undefined;

    try {
      // Get patient profile for age and gender
      const patientProfile = await db.query.patientProfiles.findFirst({
        where: eq(patientProfiles.id, appointment.patientId),
        columns: {
          dob: true,
          gender: true,
        },
      });

      // Get medical history for allergies, conditions, and current medications
      const patientMedicalHistory = await db.query.medicalHistory.findFirst({
        where: eq(medicalHistory.patientId, appointment.patientId),
        columns: {
          allergies: true,
          conditions: true,
          currentMedications: true,
        },
      });

      if (patientProfile || patientMedicalHistory) {
        patientContext = {};

        if (patientProfile) {
          // Calculate age from DOB
          if (patientProfile.dob) {
            const today = new Date();
            const birthDate = new Date(patientProfile.dob);
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (
              monthDiff < 0 ||
              (monthDiff === 0 && today.getDate() < birthDate.getDate())
            ) {
              age--;
            }
            patientContext.age = age;
          }

          if (patientProfile.gender) {
            patientContext.gender = patientProfile.gender;
          }
        }

        if (patientMedicalHistory) {
          if (
            patientMedicalHistory.allergies &&
            patientMedicalHistory.allergies.length > 0
          ) {
            patientContext.allergies = patientMedicalHistory.allergies;
          }
          if (
            patientMedicalHistory.conditions &&
            patientMedicalHistory.conditions.length > 0
          ) {
            patientContext.conditions = patientMedicalHistory.conditions;
          }
          if (
            patientMedicalHistory.currentMedications &&
            patientMedicalHistory.currentMedications.length > 0
          ) {
            patientContext.currentMedications =
              patientMedicalHistory.currentMedications;
          }
        }
      }
    } catch (contextError) {
      console.error("Error fetching patient context:", contextError);
      // Continue without patient context if fetching fails
    }

    // Generate medication suggestions using Gemini
    const suggestions = await generateMedicationSuggestions(
      diagnosis,
      existingMedications,
      patientContext,
      symptoms,
    );

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      suggestions,
      disclaimer: MEDICATION_DISCLAIMER,
      processingTime,
    });
  } catch (error) {
    console.error("Error generating medication suggestions:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";

    // Return user-friendly error messages
    if (errorMessage.includes("timeout")) {
      return NextResponse.json(
        { error: "AI service is taking too long. Please try again." },
        { status: 504 },
      );
    }

    if (errorMessage.includes("GOOGLE_GEMINI_API_KEY")) {
      return NextResponse.json(
        { error: "AI service is not configured" },
        { status: 503 },
      );
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
