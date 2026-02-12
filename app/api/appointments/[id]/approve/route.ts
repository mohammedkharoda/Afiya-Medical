import { NextRequest, NextResponse } from "next/server";
import { db, appointments, doctorProfiles } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { triggerAppointmentUpdate } from "@/lib/pusher";
import { notifyPatientAppointmentApproved } from "@/lib/notifications";
import { format } from "date-fns";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only doctors and admins can approve appointments
    if (session.user.role !== "DOCTOR" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only doctors can approve appointments" },
        { status: 403 },
      );
    }

    const { id: appointmentId } = await params;
    let videoConsultationFee: number | null = null;

    try {
      const body = await req.json();
      if (body?.videoConsultationFee !== undefined) {
        videoConsultationFee = Number(body.videoConsultationFee);
      }
    } catch {
      // Non-video approvals can be submitted without a JSON body.
    }

    // Get the appointment with patient info
    const appointment = await db.query.appointments.findFirst({
      where: eq(appointments.id, appointmentId),
      with: {
        patient: {
          with: { user: true },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 },
      );
    }

    // Check if appointment is pending
    if (appointment.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending appointments can be approved" },
        { status: 400 },
      );
    }

    if (session.user.role !== "ADMIN" &&
        appointment.doctorId &&
        appointment.doctorId !== session.user.id) {
      return NextResponse.json(
        { error: "You are not authorized to approve this appointment" },
        { status: 403 },
      );
    }

    const now = new Date();
    const updateData: Record<string, unknown> = {
      status: "SCHEDULED",
      approvedAt: now,
      approvedBy: session.user.id,
      updatedAt: now,
    };

    if (appointment.isVideoConsultation) {
      if (!Number.isFinite(videoConsultationFee) || (videoConsultationFee ?? 0) <= 0) {
        return NextResponse.json(
          { error: "A valid video consultation amount is required" },
          { status: 400 },
        );
      }

      const approvingDoctorId = appointment.doctorId || session.user.id;
      const doctorProfile = await db.query.doctorProfiles.findFirst({
        where: eq(doctorProfiles.userId, approvingDoctorId),
      });

      if (!doctorProfile?.upiId) {
        return NextResponse.json(
          { error: "Doctor UPI details are required before approving video consultation" },
          { status: 400 },
        );
      }

      const normalizedFee = Math.round((videoConsultationFee ?? 0) * 100) / 100;
      const depositAmount = Math.round((normalizedFee * 0.5) * 100) / 100;
      const remainingAmount = Math.round((normalizedFee - depositAmount) * 100) / 100;

      updateData.videoConsultationFee = normalizedFee;
      updateData.depositAmount = depositAmount;
      updateData.depositPaid = false;
      updateData.depositConfirmedAt = null;
      updateData.depositVerifiedAt = null;
      updateData.depositPaymentScreenshot = null;
      updateData.depositCancellationScheduledAt = new Date(
        now.getTime() + 24 * 60 * 60 * 1000,
      );
      updateData.remainingAmount = remainingAmount;
      updateData.remainingPaid = false;
      updateData.remainingConfirmedAt = null;
      updateData.remainingVerifiedAt = null;
      updateData.remainingPaymentScreenshot = null;
      updateData.prescriptionWithheld = true;
      updateData.paymentStatus = "PENDING";
    }

    // Update appointment to approved (SCHEDULED)
    const [updatedAppointment] = await db
      .update(appointments)
      .set(updateData)
      .where(eq(appointments.id, appointmentId))
      .returning();

    // Send notification to patient (pass doctorId for correct doctor info in email)
    const patientUserId = appointment.patient?.user?.id;
    if (patientUserId) {
      const formattedDate = format(appointment.appointmentDate, "MMMM d, yyyy");
      // Use appointment's assigned doctor or the approving doctor
      const doctorId = appointment.doctorId || session.user.id;

      notifyPatientAppointmentApproved(
        patientUserId,
        formattedDate,
        appointment.appointmentTime,
        doctorId,
      ).catch((err) =>
        console.error("Error notifying patient of approval:", err),
      );
    }

    // Trigger real-time update via Pusher
    triggerAppointmentUpdate({
      id: updatedAppointment.id,
      status: updatedAppointment.status,
      patientId: updatedAppointment.patientId,
    }).catch((err) =>
      console.error("Error triggering appointment update:", err),
    );

    return NextResponse.json({
      success: true,
      message: "Appointment approved successfully",
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error("Error approving appointment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
