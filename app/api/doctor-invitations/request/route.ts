import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { desc, eq, ilike } from "drizzle-orm";
import { z } from "zod";
import { db, doctorInvitations, users } from "@/lib/db";
import { getAppBaseUrl } from "@/lib/app-url";
import { sendDoctorInvitationEmail } from "@/lib/email";
import { safeEmailSchema } from "@/lib/validations/auth";

const INVITATION_EXPIRY_DAYS = 7;

const doctorInviteRequestSchema = z.object({
  email: safeEmailSchema,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = doctorInviteRequestSchema.parse(body);
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await db.query.users.findFirst({
      where: ilike(users.email, normalizedEmail),
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            existingUser.role === "DOCTOR"
              ? "A doctor account with this email already exists. Please sign in instead."
              : "A user with this email already exists.",
        },
        { status: 400 },
      );
    }

    const inviter = await db.query.users.findFirst({
      where: eq(users.role, "ADMIN"),
      columns: {
        id: true,
      },
    });

    if (!inviter) {
      return NextResponse.json(
        {
          error:
            "Doctor registration is not available right now. Please try again later.",
        },
        { status: 503 },
      );
    }

    const existingInvitations = await db.query.doctorInvitations.findMany({
      where: ilike(doctorInvitations.email, normalizedEmail),
      orderBy: [desc(doctorInvitations.createdAt)],
    });
    const latestInvitation = existingInvitations[0];

    if (latestInvitation?.status === "ACCEPTED") {
      return NextResponse.json(
        {
          error:
            "A doctor registration has already been started with this email. Please use the link you received or sign in.",
        },
        { status: 400 },
      );
    }

    let token = latestInvitation?.token;
    let expiresAt = latestInvitation?.expiresAt;
    let invitationId = latestInvitation?.id;
    let reusedExistingInvitation = false;

    if (
      latestInvitation &&
      latestInvitation.status === "PENDING" &&
      latestInvitation.expiresAt > new Date()
    ) {
      reusedExistingInvitation = true;
    } else {
      token = crypto.randomBytes(32).toString("base64url");
      expiresAt = new Date(
        Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
      );

      const [invitation] = await db
        .insert(doctorInvitations)
        .values({
          email: normalizedEmail,
          name: null,
          token,
          status: "PENDING",
          invitedBy: inviter.id,
          expiresAt,
          isTestAccount: false,
        })
        .returning({
          id: doctorInvitations.id,
        });

      invitationId = invitation.id;
    }

    const signupUrl = `${getAppBaseUrl(req)}/register/doctor?token=${token}`;
    const emailSent = await sendDoctorInvitationEmail(
      normalizedEmail,
      undefined,
      signupUrl,
      INVITATION_EXPIRY_DAYS,
    );

    if (!emailSent) {
      return NextResponse.json(
        { error: "We could not send the registration email right now." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: reusedExistingInvitation
        ? "We sent your doctor registration link again. Please check your email."
        : "We sent your doctor registration link. Please check your email.",
      invitationId,
      email: normalizedEmail,
    });
  } catch (error: unknown) {
    console.error("Error requesting doctor invitation:", error);

    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "ZodError"
    ) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to send doctor registration email." },
      { status: 500 },
    );
  }
}
