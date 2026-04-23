import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  db,
  users,
  doctorProfiles,
  doctorVerifications,
  doctorInvitations,
  sessions,
  appointments,
  doctorSchedule,
  patientProfiles,
} from "@/lib/db";
import { desc, eq, ilike, inArray } from "drizzle-orm";

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
        isVerified: users.isVerified,
        speciality: doctorProfiles.speciality,
        degrees: doctorProfiles.degrees,
        experience: doctorProfiles.experience,
        isTestAccount: doctorProfiles.isTestAccount,
        verificationStatus: doctorVerifications.status,
        verificationReviewedAt: doctorVerifications.reviewedAt,
      })
      .from(users)
      .innerJoin(doctorProfiles, eq(users.id, doctorProfiles.userId))
      .leftJoin(doctorVerifications, eq(doctorVerifications.userId, users.id))
      .where(eq(users.role, "DOCTOR"))
      .orderBy(desc(users.createdAt));

    return NextResponse.json({ doctors });
  } catch (error) {
    console.error("Error fetching doctors:", error);

    const dbError = error as { cause?: { code?: string } };
    if (dbError.cause?.code === "42P01") {
      try {
        const fallbackDoctors = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
            createdAt: users.createdAt,
            isVerified: users.isVerified,
            speciality: doctorProfiles.speciality,
            degrees: doctorProfiles.degrees,
            experience: doctorProfiles.experience,
            isTestAccount: doctorProfiles.isTestAccount,
            verificationStatus: users.isVerified,
            verificationReviewedAt: users.updatedAt,
          })
          .from(users)
          .innerJoin(doctorProfiles, eq(users.id, doctorProfiles.userId))
          .where(eq(users.role, "DOCTOR"))
          .orderBy(desc(users.createdAt));

        return NextResponse.json({
          doctors: fallbackDoctors.map((doctor) => ({
            ...doctor,
            verificationStatus: doctor.isVerified ? "APPROVED" : "PENDING",
          })),
          migrationRequired: true,
        });
      } catch (fallbackError) {
        console.error("Fallback doctor fetch failed:", fallbackError);
      }
    }

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

    const normalizedDoctorEmail = doctorEmail?.trim();

    // Find doctor by ID or email
    let doctor;
    if (doctorId) {
      doctor = await db.query.users.findFirst({
        where: eq(users.id, doctorId),
      });
    } else if (normalizedDoctorEmail) {
      doctor = await db.query.users.findFirst({
        where: ilike(users.email, normalizedDoctorEmail),
      });
    }

    if (!doctor) {
      if (!normalizedDoctorEmail) {
        return NextResponse.json(
          { error: "Doctor not found" },
          { status: 404 },
        );
      }

      const orphanInvitations = await db.query.doctorInvitations.findMany({
        where: ilike(doctorInvitations.email, normalizedDoctorEmail),
      });

      if (orphanInvitations.length === 0) {
        return NextResponse.json(
          { error: "Doctor not found" },
          { status: 404 },
        );
      }

      const orphanInvitationIds = orphanInvitations.map((invitation) => invitation.id);

      await db.delete(doctorInvitations).where(
        inArray(doctorInvitations.id, orphanInvitationIds),
      );

      return NextResponse.json({
        success: true,
        message: "Doctor invitation deleted successfully",
        deletedDoctorId: null,
        deletedInvitationIds: orphanInvitationIds,
        deletedEmail: normalizedDoctorEmail,
      });
    }

    if (doctor.role !== "DOCTOR") {
      return NextResponse.json(
        { error: "User is not a doctor" },
        { status: 400 },
      );
    }

    const targetDoctorId = doctor.id;
    const relatedInvitations = await db.query.doctorInvitations.findMany({
      where: ilike(doctorInvitations.email, doctor.email),
    });
    const verificationRecords = await db.query.doctorVerifications.findMany({
      where: eq(doctorVerifications.userId, targetDoctorId),
      columns: {
        invitationId: true,
      },
    });
    const invitationIds = [
      ...new Set(
        [
          ...relatedInvitations.map((invitation) => invitation.id),
          ...verificationRecords
            .map((verification) => verification.invitationId)
            .filter((invitationId): invitationId is string => Boolean(invitationId)),
        ],
      ),
    ];

    await db.transaction(async (tx) => {
      // Clear preferred doctor references from patient profiles.
      await tx
        .update(patientProfiles)
        .set({ preferredDoctorId: null })
        .where(eq(patientProfiles.preferredDoctorId, targetDoctorId));

      // Remove future schedule rows owned by the doctor.
      await tx
        .delete(doctorSchedule)
        .where(eq(doctorSchedule.doctorId, targetDoctorId));

      // Preserve appointment history but remove the doctor reference.
      await tx
        .update(appointments)
        .set({
          doctorId: null,
          status: "CANCELLED",
          cancellationReason: "Doctor account was removed from the system",
          cancelledAt: new Date(),
        })
        .where(eq(appointments.doctorId, targetDoctorId));

      if (invitationIds.length > 0) {
        await tx
          .delete(doctorInvitations)
          .where(inArray(doctorInvitations.id, invitationIds));
      }

      await tx.delete(sessions).where(eq(sessions.userId, targetDoctorId));

      // Cascade removes the verification row and auth records.
      await tx.delete(doctorProfiles).where(eq(doctorProfiles.userId, targetDoctorId));
      await tx.delete(users).where(eq(users.id, targetDoctorId));
    });

    return NextResponse.json({
      success: true,
      message: "Doctor deleted successfully",
      deletedDoctorId: targetDoctorId,
      deletedInvitationIds: invitationIds,
      deletedEmail: doctor.email,
    });
  } catch (error) {
    console.error("Error deleting doctor:", error);
    return NextResponse.json(
      { error: "Failed to delete doctor" },
      { status: 500 },
    );
  }
}
