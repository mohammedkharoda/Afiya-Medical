import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db, appointments, patientProfiles } from "@/lib/db";
import { eq, or, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role || "PATIENT";
    const userId = session.user.id;

    // Verify user is a doctor
    if (userRole !== "DOCTOR") {
      return NextResponse.json(
        { error: "Only doctors can access patient list" },
        { status: 403 }
      );
    }

    // Find all patient IDs that have appointments handled by this doctor
    // A patient "belongs" to a doctor if the doctor has approved, completed, or handled their appointment
    const doctorAppointments = await db.query.appointments.findMany({
      where: or(
        eq(appointments.approvedBy, userId),
        eq(appointments.declinedBy, userId),
        eq(appointments.cancelledBy, userId),
        eq(appointments.rescheduledBy, userId)
      ),
      columns: {
        patientId: true,
      },
    });

    // Get unique patient IDs
    const patientIds = [...new Set(doctorAppointments.map((a) => a.patientId))];

    if (patientIds.length === 0) {
      return NextResponse.json({ patients: [] });
    }

    // Fetch patient profiles for these patients
    const patientsData = await db.query.patientProfiles.findMany({
      where: inArray(patientProfiles.id, patientIds),
      with: {
        user: true,
        appointments: {
          where: or(
            eq(appointments.approvedBy, userId),
            eq(appointments.declinedBy, userId),
            eq(appointments.cancelledBy, userId),
            eq(appointments.rescheduledBy, userId)
          ),
          orderBy: (appointments, { desc }) => [
            desc(appointments.appointmentDate),
          ],
          limit: 1,
        },
      },
    });

    // Format the response
    const patients = patientsData
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

    return NextResponse.json({ patients });
  } catch (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json(
      { error: "Failed to fetch patients" },
      { status: 500 }
    );
  }
}
