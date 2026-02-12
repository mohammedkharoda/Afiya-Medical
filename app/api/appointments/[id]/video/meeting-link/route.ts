import { NextRequest, NextResponse } from "next/server";
import { db, appointments } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { createVideoMeeting } from "@/lib/video-meeting";

/**
 * GET /api/appointments/[id]/video/meeting-link
 * Get or generate a video meeting link for an appointment
 *
 * Authorization: Patient or Doctor associated with the appointment
 * Requirements: Appointment must be video consultation and deposit must be paid
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: appointmentId } = await params;

    // Get appointment with patient and doctor details
    const appointment = await db.query.appointments.findFirst({
      where: eq(appointments.id, appointmentId),
      with: {
        patient: { with: { user: true } },
        doctor: true,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Verify user is participant (doctor or patient)
    const isDoctor = appointment.doctorId === session.user.id;
    const isPatient = appointment.patient.userId === session.user.id;

    if (!isDoctor && !isPatient) {
      return NextResponse.json(
        { error: "You are not authorized to access this appointment" },
        { status: 403 }
      );
    }

    // Check if this is a video consultation
    if (!appointment.isVideoConsultation) {
      return NextResponse.json(
        { error: "This is not a video consultation" },
        { status: 400 }
      );
    }

    // Check if deposit is paid
    if (!appointment.depositPaid) {
      return NextResponse.json(
        { error: "Deposit payment required before accessing video link" },
        { status: 403 }
      );
    }

    // Check if appointment is in the future or ongoing
    const appointmentDateTime = new Date(
      `${appointment.appointmentDate.toISOString().split("T")[0]} ${appointment.appointmentTime}`
    );
    const now = new Date();
    const earlyJoinMinutes = parseInt(process.env.VIDEO_CALL_EARLY_JOIN_MINUTES || "15");
    const earlyJoinTime = new Date(appointmentDateTime.getTime() - earlyJoinMinutes * 60 * 1000);

    // Can join 15 minutes before appointment time
    if (now < earlyJoinTime) {
      return NextResponse.json(
        {
          error: "Video call link will be available 15 minutes before appointment",
          availableAt: earlyJoinTime.toISOString(),
        },
        { status: 403 }
      );
    }

    // If meeting link already exists, return it
    if (appointment.videoMeetingUrl) {
      return NextResponse.json({
        meetingUrl: appointment.videoMeetingUrl,
        meetingId: appointment.videoMeetingId,
        meetingPassword: appointment.videoMeetingPassword,
        createdAt: appointment.videoMeetingCreatedAt,
      });
    }

    // Create new meeting link
    try {
      const meeting = await createVideoMeeting(
        appointmentId,
        appointmentDateTime,
        appointment.doctor?.name || "Doctor",
        appointment.patient.user.name,
        appointment.doctor?.email,
        appointment.patient.user.email
      );

      // Store meeting link in database
      const [updatedAppointment] = await db
        .update(appointments)
        .set({
          videoMeetingUrl: meeting.meetingUrl,
          videoMeetingId: meeting.meetingId,
          videoMeetingPassword: meeting.password,
          videoMeetingCreatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(appointments.id, appointmentId))
        .returning();

      return NextResponse.json({
        meetingUrl: meeting.meetingUrl,
        meetingId: meeting.meetingId,
        meetingPassword: meeting.password,
        createdAt: updatedAppointment.videoMeetingCreatedAt,
      });
    } catch (videoError) {
      console.error("Error creating video meeting:", videoError);
      return NextResponse.json(
        {
          error: "Failed to create video meeting",
          details: videoError instanceof Error ? videoError.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error getting meeting link:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
