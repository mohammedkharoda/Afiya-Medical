import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import {
  patientProfiles,
  medicalHistory,
  appointments,
} from "@/lib/db/schema";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role || "PATIENT";

    // Verify user is a doctor
    if (userRole !== "DOCTOR" && userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Only doctors can access patient details" },
        { status: 403 }
      );
    }

    const { id: patientId } = await params;

    // Fetch patient profile with user details
    const patientProfile = await db.query.patientProfiles.findFirst({
      where: eq(patientProfiles.id, patientId),
      with: {
        user: true,
      },
    });

    if (!patientProfile) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    // Fetch medical history
    const medicalHistoryData = await db.query.medicalHistory.findFirst({
      where: eq(medicalHistory.patientId, patientId),
    });

    // Fetch appointments with prescriptions and medications
    const appointmentsData = await db.query.appointments.findMany({
      where: eq(appointments.patientId, patientId),
      with: {
        prescription: {
          with: {
            medications: true,
          },
        },
        payment: true,
      },
      orderBy: (appointments, { desc }) => [desc(appointments.appointmentDate)],
    });

    // Get last completed appointment date
    const lastCheckup = appointmentsData.find(
      (apt) => apt.status === "COMPLETED"
    );

    return NextResponse.json({
      patient: {
        id: patientProfile.id,
        user: {
          id: patientProfile.user.id,
          name: patientProfile.user.name,
          email: patientProfile.user.email,
          phone: patientProfile.user.phone,
          image: patientProfile.user.image,
        },
        profile: {
          dob: patientProfile.dob,
          gender: patientProfile.gender,
          bloodGroup: patientProfile.bloodGroup,
          address: patientProfile.address,
          emergencyContact: patientProfile.emergencyContact,
        },
        medicalHistory: medicalHistoryData || null,
        appointments: appointmentsData,
        lastCheckup: lastCheckup?.appointmentDate || null,
        stats: {
          totalAppointments: appointmentsData.length,
          completedAppointments: appointmentsData.filter(
            (a) => a.status === "COMPLETED"
          ).length,
          cancelledAppointments: appointmentsData.filter(
            (a) => a.status === "CANCELLED"
          ).length,
          totalPrescriptions: appointmentsData.filter((a) => a.prescription)
            .length,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching patient details:", error);
    return NextResponse.json(
      { error: "Failed to fetch patient details" },
      { status: 500 }
    );
  }
}
