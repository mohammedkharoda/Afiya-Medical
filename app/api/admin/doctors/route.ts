import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  db,
  users,
  doctorProfiles,
  sessions,
  appointments,
  doctorSchedule,
  patientProfiles,
} from "@/lib/db";
import { eq, desc } from "drizzle-orm";

// GET - List all doctors
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can access this resource" },
        { status: 403 },
      );
    }

    // Fetch all doctors with their profiles
    const doctors = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        createdAt: users.createdAt,
        speciality: doctorProfiles.speciality,
        degrees: doctorProfiles.degrees,
        experience: doctorProfiles.experience,
        isTestAccount: doctorProfiles.isTestAccount,
      })
      .from(users)
      .innerJoin(doctorProfiles, eq(users.id, doctorProfiles.userId))
      .where(eq(users.role, "DOCTOR"))
      .orderBy(desc(users.createdAt));

    return NextResponse.json({ doctors });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return NextResponse.json(
      { error: "Failed to fetch doctors" },
      { status: 500 },
    );
  }
}

// DELETE - Delete a doctor
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can delete doctors" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("id");
    const doctorEmail = searchParams.get("email");

    if (!doctorId && !doctorEmail) {
      return NextResponse.json(
        { error: "Doctor ID or email is required" },
        { status: 400 },
      );
    }

    // Find doctor by ID or email
    let doctor;
    if (doctorId) {
      doctor = await db.query.users.findFirst({
        where: eq(users.id, doctorId),
      });
    } else if (doctorEmail) {
      doctor = await db.query.users.findFirst({
        where: eq(users.email, doctorEmail),
      });
    }

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    if (doctor.role !== "DOCTOR") {
      return NextResponse.json(
        { error: "User is not a doctor" },
        { status: 400 },
      );
    }

    const targetDoctorId = doctor.id;

    // Clear preferred doctor references from patient profiles
    await db
      .update(patientProfiles)
      .set({ preferredDoctorId: null })
      .where(eq(patientProfiles.preferredDoctorId, targetDoctorId));

    // Delete doctor's schedule
    await db
      .delete(doctorSchedule)
      .where(eq(doctorSchedule.doctorId, targetDoctorId));

    // Set doctorId to null in appointments and cancel pending ones
    // This preserves appointment history while removing doctor reference
    await db
      .update(appointments)
      .set({
        doctorId: null,
        status: "CANCELLED",
        cancellationReason: "Doctor account was removed from the system",
        cancelledAt: new Date(),
      })
      .where(eq(appointments.doctorId, targetDoctorId));

    // Delete sessions
    await db.delete(sessions).where(eq(sessions.userId, targetDoctorId));

    // Delete doctor profile (cascade will handle this, but being explicit)
    await db
      .delete(doctorProfiles)
      .where(eq(doctorProfiles.userId, targetDoctorId));

    // Delete user
    await db.delete(users).where(eq(users.id, targetDoctorId));

    return NextResponse.json({
      success: true,
      message: "Doctor deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting doctor:", error);
    return NextResponse.json(
      { error: "Failed to delete doctor" },
      { status: 500 },
    );
  }
}
