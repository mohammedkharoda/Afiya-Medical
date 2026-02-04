import { NextRequest, NextResponse } from "next/server";
import {
  db,
  users,
  doctorInvitations,
  sessions,
  doctorProfiles,
} from "@/lib/db";
import { eq, ilike } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { doctorRegisterSchema } from "@/lib/validations/auth";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { createId } from "@paralleldrive/cuid2";
import { getSessionExpiryByRole } from "@/lib/session-utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const validatedData = doctorRegisterSchema.parse(body);
    const {
      name,
      email,
      phone,
      password,
      token,
      speciality,
      degrees,
      experience,
      upiId,
      clinicAddress,
    } = validatedData;

    // Validate phone and convert to E.164
    const parsedPhone = parsePhoneNumberFromString(phone, "IN");
    if (!parsedPhone || !parsedPhone.isValid()) {
      return NextResponse.json(
        { error: "Invalid phone number" },
        { status: 400 },
      );
    }
    const phoneE164 = parsedPhone.format("E.164");

    // Find invitation by token
    const invitation = await db.query.doctorInvitations.findFirst({
      where: eq(doctorInvitations.token, token),
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation token" },
        { status: 400 },
      );
    }

    // Check invitation status
    if (invitation.status === "ACCEPTED") {
      return NextResponse.json(
        { error: "This invitation has already been used" },
        { status: 400 },
      );
    }

    if (invitation.status === "REVOKED") {
      return NextResponse.json(
        { error: "This invitation has been revoked" },
        { status: 400 },
      );
    }

    if (invitation.status === "EXPIRED" || invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This invitation has expired" },
        { status: 400 },
      );
    }

    // Verify email matches invitation (case-insensitive)
    if (email.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json(
        { error: "Email does not match the invitation" },
        { status: 400 },
      );
    }

    // Check if user already exists (case-insensitive)
    const existingUser = await db.query.users.findFirst({
      where: ilike(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with DOCTOR role (store original email case)
    const [user] = await db
      .insert(users)
      .values({
        name,
        email,
        password: hashedPassword,
        phone: phoneE164,
        role: "DOCTOR",
        isVerified: true, // Doctor is pre-verified via invitation
        emailVerified: true,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
      });

    // Create doctor profile
    await db.insert(doctorProfiles).values({
      userId: user.id,
      speciality,
      degrees: degrees || [],
      experience: experience || null,
      upiId,
      clinicAddress: clinicAddress || null,
      isTestAccount: invitation.isTestAccount,
    });

    // Mark invitation as accepted
    await db
      .update(doctorInvitations)
      .set({
        status: "ACCEPTED",
        acceptedAt: new Date(),
      })
      .where(eq(doctorInvitations.id, invitation.id));

    // Create session for auto-login
    const sessionToken = createId();
    const expiresAt = getSessionExpiryByRole("DOCTOR");

    await db.insert(sessions).values({
      id: createId(),
      token: sessionToken,
      userId: user.id,
      expiresAt,
      ipAddress: null,
      userAgent: null,
    });

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      message: "Registration successful",
      user,
      redirectTo: "/dashboard",
    });

    response.cookies.set("better-auth.session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });

    return response;
  } catch (error: unknown) {
    console.error("Doctor registration error:", error);

    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "ZodError"
    ) {
      const zodError = error as { errors?: Array<{ message: string }> };
      return NextResponse.json(
        { error: "Invalid input data", details: zodError.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 },
    );
  }
}
