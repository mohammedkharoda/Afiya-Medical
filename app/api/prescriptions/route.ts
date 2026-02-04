import { NextRequest, NextResponse } from "next/server";
import {
  db,
  patientProfiles,
  prescriptions,
  medications,
  appointments,
  medicalDocuments,
  users,
} from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, id: userId } = session.user;
    const normalizedRole = role?.toUpperCase();

    let prescriptionsList;

    if (normalizedRole === "PATIENT") {
      const patientProfile = await db.query.patientProfiles.findFirst({
        where: eq(patientProfiles.userId, userId),
      });

      if (!patientProfile) {
        return NextResponse.json({ prescriptions: [] });
      }

      prescriptionsList = await db.query.prescriptions.findMany({
        with: {
          medications: true,
          appointment: true,
        },
        orderBy: [desc(prescriptions.createdAt)],
      });

      // Filter prescriptions for patient's appointments
      prescriptionsList = prescriptionsList.filter(
        (p) => p.appointment.patientId === patientProfile.id,
      );

      // For each prescription, get the doctor from the appointment's doctorId
      const enrichedPrescriptions = await Promise.all(
        prescriptionsList.map(async (p) => {
          let doctorName = "Dr. Health";
          if (p.appointment?.doctorId) {
            const doctor = await db.query.users.findFirst({
              where: eq(users.id, p.appointment.doctorId),
            });
            if (doctor) {
              doctorName = doctor.name;
            }
          }
          return {
            ...p,
            doctorName,
          };
        }),
      );
      prescriptionsList = enrichedPrescriptions;
    } else if (normalizedRole === "DOCTOR" || normalizedRole === "ADMIN") {
      prescriptionsList = await db.query.prescriptions.findMany({
        with: {
          medications: true,
          appointment: {
            with: {
              patient: {
                with: {
                  user: true,
                },
              },
            },
          },
        },
        orderBy: [desc(prescriptions.createdAt)],
      });

      // For each prescription, get the doctor from the appointment's doctorId
      const enrichedPrescriptions = await Promise.all(
        prescriptionsList.map(async (p) => {
          let doctorName = "Dr. Health";
          if (p.appointment?.doctorId) {
            const doctor = await db.query.users.findFirst({
              where: eq(users.id, p.appointment.doctorId),
            });
            if (doctor) {
              doctorName = doctor.name;
            }
          }
          return {
            ...p,
            doctorName,
          };
        }),
      );
      prescriptionsList = enrichedPrescriptions;
    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 403 });
    }

    return NextResponse.json({ prescriptions: prescriptionsList });
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);

    console.log(
      "Prescription POST - Session:",
      session ? "Found" : "Not found",
    );
    console.log("Prescription POST - User role:", session?.user?.role);

    if (
      !session ||
      (session.user.role?.toUpperCase() !== "DOCTOR" &&
        session.user.role?.toUpperCase() !== "ADMIN")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      appointmentId,
      diagnosis,
      notes,
      followUpDate,
      medications: medicationsList,
      attachmentUrl,
      attachmentPublicId,
    } = body;

    // Get appointment to get patientId and doctorId
    const appointment = await db.query.appointments.findFirst({
      where: eq(appointments.id, appointmentId),
      columns: { patientId: true, doctorId: true },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 },
      );
    }

    // Create prescription
    const [prescription] = await db
      .insert(prescriptions)
      .values({
        appointmentId,
        diagnosis,
        notes,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        attachmentUrl,
        attachmentPublicId,
      })
      .returning();

    // Create medications
    if (medicationsList && medicationsList.length > 0) {
      await db.insert(medications).values(
        medicationsList.map((med: any) => ({
          prescriptionId: prescription.id,
          medicineName: med.medicineName,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
          instructions: med.instructions,
        })),
      );
    }

    // Get prescription with medications
    const prescriptionWithMeds = await db.query.prescriptions.findFirst({
      where: eq(prescriptions.id, prescription.id),
      with: { medications: true },
    });

    // Update appointment status to completed
    await db
      .update(appointments)
      .set({ status: "COMPLETED" })
      .where(eq(appointments.id, appointmentId));

    // Prescription email is sent only after payment is confirmed (PATCH /api/payments)

    return NextResponse.json(
      { prescription: prescriptionWithMeds },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error creating prescription:", error);

    // Check for unique constraint violation
    if (
      error.code === "23505" ||
      error.message?.includes("unique") ||
      error.message?.includes("duplicate")
    ) {
      return NextResponse.json(
        { error: "A prescription already exists for this appointment" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
