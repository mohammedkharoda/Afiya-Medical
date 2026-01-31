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

      console.log("[PATIENT] Fetching doctor from database...");
      // Fetch the doctor's details (Assuming single doctor or fetching first doctor found)
      const doctor = await db.query.users.findFirst({
        where: eq(users.role, "DOCTOR"),
      });
      console.log(
        "[PATIENT] Doctor query result:",
        JSON.stringify(doctor, null, 2),
      );
      const doctorName = doctor?.name || "Dr. Health";
      console.log("[PATIENT] Using doctorName:", doctorName);

      // Inject doctor name into each prescription
      prescriptionsList = prescriptionsList.map((p) => ({
        ...p,
        doctorName: doctorName,
      }));
      console.log(
        "[PATIENT] Sample prescription:",
        JSON.stringify(prescriptionsList[0], null, 2),
      );
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

      console.log("[DOCTOR/ADMIN] Fetching doctor from database...");
      // Fetch the doctor's details for DOCTOR/ADMIN view as well
      const doctor = await db.query.users.findFirst({
        where: eq(users.role, "DOCTOR"),
      });
      console.log(
        "[DOCTOR/ADMIN] Doctor query result:",
        JSON.stringify(doctor, null, 2),
      );
      const doctorName = doctor?.name || "Dr. Health";
      console.log("[DOCTOR/ADMIN] Using doctorName:", doctorName);

      // Inject doctor name
      prescriptionsList = prescriptionsList.map((p) => ({
        ...p,
        doctorName: doctorName,
      }));
      console.log(
        "[DOCTOR/ADMIN] Sample prescription:",
        JSON.stringify(prescriptionsList[0], null, 2),
      );
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

    // Get appointment to get patientId
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

    // Send prescription ready notification email
    try {
      // Get patient details for email
      const fullAppointment = await db.query.appointments.findFirst({
        where: eq(appointments.id, appointmentId),
        with: {
          patient: {
            with: {
              user: true,
            },
          },
        },
      });

      if (fullAppointment?.patient?.user?.email) {
        const { sendPrescriptionEmail } = await import("@/lib/email");

        // Get doctor name
        const doctor = await db.query.users.findFirst({
          where: eq(users.role, "DOCTOR"),
        });

        await sendPrescriptionEmail({
          patientEmail: fullAppointment.patient.user.email,
          patientName: fullAppointment.patient.user.name,
          doctorName: doctor?.name || "Doctor",
          diagnosis,
          medications: medicationsList || [],
          notes,
          followUpDate: followUpDate
            ? new Date(followUpDate).toLocaleDateString()
            : undefined,
          attachmentUrl,
          prescriptionDate: new Date().toLocaleDateString(),
        });

        console.log("Prescription email sent to patient");
      }
    } catch (emailError) {
      console.error("Error sending prescription email:", emailError);
      // Don't fail the request if email fails
    }

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
