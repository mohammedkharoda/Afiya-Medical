import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { patientProfiles } from "@/lib/db/schema";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role || "PATIENT";

    // Verify user is a doctor
    if (userRole !== "DOCTOR" && userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Only doctors can access patient list" },
        { status: 403 }
      );
    }

    // Fetch all patients with at least one appointment
    const patientsData = await db.query.patientProfiles.findMany({
      with: {
        user: true,
        appointments: {
          orderBy: (appointments, { desc }) => [
            desc(appointments.appointmentDate),
          ],
          limit: 1,
        },
      },
    });

    console.log("Total patient profiles found:", patientsData.length);
    console.log("Sample patient data:", JSON.stringify(patientsData[0], null, 2));

    // Filter patients who have appointments and format the response
    const patients = patientsData
      .filter((p) => p.appointments.length > 0)
      .map((patient) => ({
        id: patient.id,
        name: patient.user.name,
        email: patient.user.email,
        phone: patient.user.phone,
        image: patient.user.image,
        bloodGroup: patient.bloodGroup,
        gender: patient.gender,
        lastVisit: patient.appointments[0]?.appointmentDate || null,
      }))
      .sort((a, b) => {
        // Sort by last visit date (most recent first)
        if (!a.lastVisit) return 1;
        if (!b.lastVisit) return -1;
        return (
          new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime()
        );
      });

    console.log("Patients with appointments:", patients.length);

    return NextResponse.json({ patients });
  } catch (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json(
      { error: "Failed to fetch patients" },
      { status: 500 }
    );
  }
}
