import { NextRequest, NextResponse } from "next/server";
import { db, appointments, patientProfiles } from "@/lib/db";
import { eq, and, ne, gte, lt } from "drizzle-orm";
import { getSession } from "@/lib/session";
import {
  notifyPatientAppointmentPending,
  notifyDoctorApprovalNeeded,
} from "@/lib/notifications";
import { format } from "date-fns";
import { triggerNewAppointment } from "@/lib/pusher";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session) {
      console.log("Appointments API - No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const role = session.user.role || "PATIENT";

    console.log("Appointments API - User ID:", userId);
    console.log("Appointments API - Role:", role);

    let appointmentsList;

    if (role === "DOCTOR" || role === "ADMIN") {
      // Doctor/Admin sees all appointments with patient info
      appointmentsList = await db.query.appointments.findMany({
        with: {
          patient: {
            with: {
              user: true,
            },
          },
          prescription: {
            with: { medications: true },
          },
          payment: true,
        },
        orderBy: (appointments, { desc }) => [
          desc(appointments.appointmentDate),
        ],
      });
      console.log(
        "Appointments API - Doctor view, found:",
        appointmentsList.length,
      );
    } else {
      // Patient sees only their appointments
      const patientProfile = await db.query.patientProfiles.findFirst({
        where: eq(patientProfiles.userId, userId),
      });

      console.log(
        "Appointments API - Patient Profile found:",
        patientProfile?.id,
      );

      if (!patientProfile) {
        console.log(
          "Appointments API - No patient profile found for user:",
          userId,
        );
        return NextResponse.json({ appointments: [] });
      }

      appointmentsList = await db.query.appointments.findMany({
        where: eq(appointments.patientId, patientProfile.id),
        with: {
          patient: {
            with: {
              user: true,
              medicalDocuments: true,
            },
          },
          prescription: {
            with: { medications: true },
          },
          payment: true,
        },
        orderBy: (appointments, { desc }) => [
          desc(appointments.appointmentDate),
        ],
      });
      console.log(
        "Appointments API - Patient view, found:",
        appointmentsList.length,
      );
    }

    return NextResponse.json({ appointments: appointmentsList });
  } catch (error) {
    console.error("Error fetching appointments:", error);
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only doctors/admins cannot book appointments
    const role = session.user.role;
    if (role === "DOCTOR" || role === "ADMIN") {
      return NextResponse.json(
        { error: "Doctors cannot book appointments" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { appointmentDate, appointmentTime, symptoms, notes } = body;

    // Get patient profile
    const patientProfile = await db.query.patientProfiles.findFirst({
      where: eq(patientProfiles.userId, session.user.id),
    });

    if (!patientProfile) {
      return NextResponse.json(
        { error: "Patient profile not found" },
        { status: 404 },
      );
    }

    // Check if medical history is completed
    if (!patientProfile.hasCompletedMedicalHistory) {
      return NextResponse.json(
        { error: "Please complete your medical history first" },
        { status: 400 },
      );
    }

    // Parse appointment date for race condition check
    const appointmentDateObj = new Date(appointmentDate);
    const [year, month, day] = [
      appointmentDateObj.getFullYear(),
      appointmentDateObj.getMonth(),
      appointmentDateObj.getDate(),
    ];
    const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month, day + 1, 0, 0, 0, 0));

    // Race condition protection: Check if slot is still available
    const existingAppointment = await db.query.appointments.findFirst({
      where: and(
        gte(appointments.appointmentDate, startOfDay),
        lt(appointments.appointmentDate, endOfDay),
        eq(appointments.appointmentTime, appointmentTime),
        ne(appointments.status, "CANCELLED"),
      ),
    });

    if (existingAppointment) {
      return NextResponse.json(
        {
          error:
            "This time slot has just been booked by another patient. Please select a different time.",
        },
        { status: 409 },
      );
    }

    // Create appointment with PENDING status (awaiting doctor approval)
    const [appointment] = await db
      .insert(appointments)
      .values({
        patientId: patientProfile.id,
        appointmentDate: new Date(appointmentDate),
        appointmentTime,
        symptoms,
        notes,
        status: "PENDING",
        paymentStatus: "PENDING",
      })
      .returning();

    // Send notifications (don't await to avoid blocking response)
    const formattedDate = format(new Date(appointmentDate), "MMMM d, yyyy");

    // Notify patient that appointment is pending approval
    notifyPatientAppointmentPending(
      session.user.id,
      formattedDate,
      appointmentTime,
    ).catch((err) => console.error("Error notifying patient:", err));

    // Notify doctor that approval is needed
    notifyDoctorApprovalNeeded(
      session.user.id,
      formattedDate,
      appointmentTime,
      symptoms,
    ).catch((err) => console.error("Error notifying doctor:", err));

    // Trigger real-time update for doctor's dashboard
    triggerNewAppointment({
      id: appointment.id,
      status: appointment.status,
      patientId: appointment.patientId,
    }).catch((err) => console.error("Error triggering new appointment:", err));

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
