import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import {
  db,
  doctorProfiles,
  doctorVerifications,
  users,
} from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can access doctor verifications" },
        { status: 403 },
      );
    }

    const requests = await db
      .select({
        id: doctorVerifications.id,
        userId: doctorVerifications.userId,
        invitationId: doctorVerifications.invitationId,
        status: doctorVerifications.status,
        registrationNumber: doctorVerifications.registrationNumber,
        registrationCertificateUrl: doctorVerifications.registrationCertificateUrl,
        registrationCertificateName:
          doctorVerifications.registrationCertificateName,
        aadhaarCardUrl: doctorVerifications.aadhaarCardUrl,
        aadhaarCardName: doctorVerifications.aadhaarCardName,
        panCardUrl: doctorVerifications.panCardUrl,
        panCardName: doctorVerifications.panCardName,
        reviewNotes: doctorVerifications.reviewNotes,
        reviewedBy: doctorVerifications.reviewedBy,
        reviewedAt: doctorVerifications.reviewedAt,
        submittedAt: doctorVerifications.submittedAt,
        createdAt: doctorVerifications.createdAt,
        doctorName: users.name,
        doctorEmail: users.email,
        doctorPhone: users.phone,
        doctorIsActive: users.isVerified,
        speciality: doctorProfiles.speciality,
        degrees: doctorProfiles.degrees,
        experience: doctorProfiles.experience,
        clinicAddress: doctorProfiles.clinicAddress,
        isTestAccount: doctorProfiles.isTestAccount,
      })
      .from(doctorVerifications)
      .innerJoin(users, eq(doctorVerifications.userId, users.id))
      .innerJoin(doctorProfiles, eq(doctorProfiles.userId, users.id))
      .orderBy(desc(doctorVerifications.createdAt));

    const summary = {
      total: requests.length,
      pending: requests.filter((item) => item.status === "PENDING").length,
      approved: requests.filter((item) => item.status === "APPROVED").length,
      rejected: requests.filter((item) => item.status === "REJECTED").length,
    };

    return NextResponse.json({ requests, summary });
  } catch (error) {
    console.error("Error fetching doctor verifications:", error);

    const dbError = error as { cause?: { code?: string } };
    if (dbError.cause?.code === "42P01") {
      return NextResponse.json({
        requests: [],
        summary: {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
        },
        migrationRequired: true,
      });
    }

    return NextResponse.json(
      { error: "Failed to fetch doctor verifications" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can review doctor verifications" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const verificationId = body?.verificationId as string | undefined;
    const action = body?.action as "approve" | "reject" | undefined;
    const reviewNotes =
      typeof body?.reviewNotes === "string" ? body.reviewNotes.trim() : "";

    if (!verificationId || !action) {
      return NextResponse.json(
        { error: "verificationId and action are required" },
        { status: 400 },
      );
    }

    if (action === "reject" && !reviewNotes) {
      return NextResponse.json(
        { error: "Review notes are required when rejecting a doctor" },
        { status: 400 },
      );
    }

    const verification = await db.query.doctorVerifications.findFirst({
      where: eq(doctorVerifications.id, verificationId),
    });

    if (!verification) {
      return NextResponse.json(
        { error: "Doctor verification request not found" },
        { status: 404 },
      );
    }

    const nextStatus = action === "approve" ? "APPROVED" : "REJECTED";

    await db
      .update(doctorVerifications)
      .set({
        status: nextStatus,
        reviewNotes: reviewNotes || null,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(doctorVerifications.id, verificationId));

    await db
      .update(users)
      .set({
        isVerified: action === "approve",
        updatedAt: new Date(),
      })
      .where(eq(users.id, verification.userId));

    return NextResponse.json({
      success: true,
      message:
        action === "approve"
          ? "Doctor approved successfully"
          : "Doctor rejected successfully",
    });
  } catch (error) {
    console.error("Error reviewing doctor verification:", error);
    return NextResponse.json(
      { error: "Failed to review doctor verification" },
      { status: 500 },
    );
  }
}
