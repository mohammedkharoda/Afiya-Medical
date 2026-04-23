import { NextRequest, NextResponse } from "next/server";
import { db, appointments, patientProfiles, users, doctorProfiles } from "@/lib/db";
import { eq, and, ne, gte, lt, or, inArray } from "drizzle-orm";
import { getSession } from "@/lib/session";
import {
  notifyPatientAppointmentPending,
  notifyDoctorApprovalNeeded,
} from "@/lib/notifications";
import { format } from "date-fns";
import { triggerNewAppointment } from "@/lib/pusher";
// import { checkBotId } from "botid/server";

async function enrichAppointmentsWithDoctorPaymentDetails<T extends {
  doctorId?: string | null;
}>(appointmentsList: T[]): Promise<(T & {
  doctorName: string | null;
  doctorPublicId: string | null;
  doctorUpiId: string | null;
  doctorUpiQrCode: string | null;
})[]> {
  const doctorIds = Array.from(
    new Set(
      appointmentsList
        .map((appointment) => appointment.doctorId)
        .filter((doctorId): doctorId is string => Boolean(doctorId)),
    ),
  );

  if (doctorIds.length === 0) {
    return appointmentsList.map((appointment) => ({
      ...appointment,
      doctorName: null,
      doctorPublicId: null,
      doctorUpiId: null,
      doctorUpiQrCode: null,
    }));
  }

  const doctorRows = await db
    .select({
      id: users.id,
      name: users.name,
      publicId: doctorProfiles.publicId,
      upiId: doctorProfiles.upiId,
      upiQrCode: doctorProfiles.upiQrCode,
    })
    .from(users)
    .leftJoin(doctorProfiles, eq(users.id, doctorProfiles.userId))
    .where(inArray(users.id, doctorIds));

  const doctorMap = new Map(
    doctorRows.map((doctor) => [
      doctor.id,
        {
          doctorName: doctor.name,
          doctorPublicId: doctor.publicId,
          doctorUpiId: doctor.upiId,
          doctorUpiQrCode: doctor.upiQrCode,
        },
    ]),
  );

  return appointmentsList.map((appointment) => {
    if (!appointment.doctorId) {
      return {
        ...appointment,
        doctorName: null,
        doctorPublicId: null,
        doctorUpiId: null,
        doctorUpiQrCode: null,
      };
    }

    const doctorData = doctorMap.get(appointment.doctorId);

    return {
      ...appointment,
      doctorName: doctorData?.doctorName ?? null,
      doctorPublicId: doctorData?.doctorPublicId ?? null,
      doctorUpiId: doctorData?.doctorUpiId ?? null,
      doctorUpiQrCode: doctorData?.doctorUpiQrCode ?? null,
    };
  });
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session) {
      console.log("Appointments API - No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const role = session.user.role || "PATIENT";

    // Get query parameter for filtering video consultations
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    console.log("Appointments API - User ID:", userId);
    console.log("Appointments API - Role:", role);
    console.log("Appointments API - Type filter:", type);

    let appointmentsList;

    if (role === "DOCTOR") {
      // Doctor sees only appointments assigned to them or that they've handled
      const baseCondition = or(
        // Appointments assigned to this doctor (any status)
        eq(appointments.doctorId, userId),
        // Appointments this doctor has handled (approved, declined, cancelled, rescheduled)
        eq(appointments.approvedBy, userId),
        eq(appointments.declinedBy, userId),
        eq(appointments.cancelledBy, userId),
        eq(appointments.rescheduledBy, userId),
      );

      // Apply video consultation filter if requested
      const whereClause =
        type === "video"
          ? and(baseCondition, eq(appointments.isVideoConsultation, true))
          : baseCondition;

      appointmentsList = await db.query.appointments.findMany({
        where: whereClause,
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
    } else if (role === "ADMIN") {
      // Admin only manages doctor invitations, no access to appointments
      return NextResponse.json({ appointments: [] });
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

      // Apply video consultation filter if requested
      const whereClause =
        type === "video"
          ? and(
              eq(appointments.patientId, patientProfile.id),
              eq(appointments.isVideoConsultation, true),
            )
          : eq(appointments.patientId, patientProfile.id);

      appointmentsList = await db.query.appointments.findMany({
        where: whereClause,
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

    const enrichedAppointments =
      await enrichAppointmentsWithDoctorPaymentDetails(appointmentsList);

    return NextResponse.json(
      { appointments: enrichedAppointments },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
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

    // BotID disabled - using Vercel Bot Management + HCaptcha instead
    // const botVerification = await checkBotId();
    // if (botVerification.isBot) {
    //   return NextResponse.json(
    //     { error: "Automated requests are not allowed" },
    //     { status: 403 },
    //   );
    // }

    // Only doctors/admins cannot book appointments
    const role = session.user.role;
    if (role === "DOCTOR" || role === "ADMIN") {
      return NextResponse.json(
        { error: "Doctors cannot book appointments" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { appointmentDate, appointmentTime, symptoms, notes, doctorId, isVideoConsultation } =
      body;

    // Validate doctorId if provided
    let doctorProfile = null;
    if (doctorId) {
      const doctor = await db.query.users.findFirst({
        where: and(eq(users.id, doctorId), eq(users.role, "DOCTOR")),
      });

      if (!doctor) {
        return NextResponse.json(
          { error: "Selected doctor is not valid" },
          { status: 400 },
        );
      }

      // Get doctor profile for consultation fee and UPI details (needed for video consultation)
      if (isVideoConsultation) {
        doctorProfile = await db.query.doctorProfiles.findFirst({
          where: eq(doctorProfiles.userId, doctorId),
        });

        if (!doctorProfile) {
          return NextResponse.json(
            { error: "Doctor profile not found" },
            { status: 404 },
          );
        }

        // Verify doctor has UPI ID configured for video consultation payments
        if (!doctorProfile.upiId) {
          return NextResponse.json(
            { error: "Doctor payment details not configured. Please select a different doctor." },
            { status: 400 },
          );
        }
      }
    } else if (isVideoConsultation) {
      // Video consultation requires a specific doctor to be selected
      return NextResponse.json(
        { error: "Please select a doctor for video consultation" },
        { status: 400 },
      );
    }

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

    // Race condition protection: Check if slot is still available for this doctor
    const slotCheckConditions = [
      gte(appointments.appointmentDate, startOfDay),
      lt(appointments.appointmentDate, endOfDay),
      eq(appointments.appointmentTime, appointmentTime),
      ne(appointments.status, "CANCELLED"),
    ];

    // If a specific doctor is selected, check only their slots
    if (doctorId) {
      slotCheckConditions.push(eq(appointments.doctorId, doctorId));
    }

    const existingAppointment = await db.query.appointments.findFirst({
      where: and(...slotCheckConditions),
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
        doctorId: doctorId || null, // Doctor patient selected or null for any doctor
        appointmentDate: new Date(appointmentDate),
        appointmentTime,
        symptoms,
        notes,
        status: "PENDING",
        paymentStatus: "PENDING",
        // Video consultation fields
        isVideoConsultation: isVideoConsultation || false,
        videoConsultationFee: null,
        depositAmount: null,
        depositPaid: false,
        depositCancellationScheduledAt: null,
        remainingAmount: null,
        remainingPaid: false,
        prescriptionWithheld: isVideoConsultation || false,
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

    // Notify doctor that approval is needed (pass doctorId if specified)
    notifyDoctorApprovalNeeded(
      session.user.id,
      formattedDate,
      appointmentTime,
      symptoms,
      doctorId || undefined,
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
