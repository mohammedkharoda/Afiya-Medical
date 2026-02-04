import { NextRequest, NextResponse } from "next/server";
import { db, users, verifications, sessions } from "@/lib/db";
import { eq } from "drizzle-orm";
import { adminOtpSchema } from "@/lib/validations/auth";
import { createId } from "@paralleldrive/cuid2";
import { getSessionExpiryByRole } from "@/lib/session-utils";

// Fixed admin email
const ADMIN_EMAIL = "kharodawalam@gmail.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const validatedData = adminOtpSchema.parse(body);
    const { email, otp } = validatedData;

    // Verify this is the admin email
    if (email.toLowerCase().trim() !== ADMIN_EMAIL) {
      return NextResponse.json(
        { success: false, message: "Invalid admin email" },
        { status: 403 },
      );
    }

    // Find the OTP record
    const otpRecord = await db.query.verifications.findFirst({
      where: eq(verifications.identifier, `admin:${ADMIN_EMAIL}`),
    });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, message: "OTP not found. Please request a new one." },
        { status: 400 },
      );
    }

    // Check if OTP is expired
    if (otpRecord.expiresAt < new Date()) {
      // Delete expired OTP
      await db.delete(verifications).where(eq(verifications.id, otpRecord.id));
      return NextResponse.json(
        { success: false, message: "OTP expired. Please request a new one." },
        { status: 400 },
      );
    }

    // Verify OTP
    if (otpRecord.value !== otp) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP" },
        { status: 400 },
      );
    }

    // Delete the used OTP
    await db.delete(verifications).where(eq(verifications.id, otpRecord.id));

    // Find admin user
    const adminUser = await db.query.users.findFirst({
      where: eq(users.email, ADMIN_EMAIL),
    });

    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Admin account not found" },
        { status: 404 },
      );
    }

    // Create session for admin
    const sessionToken = createId();
    const expiresAt = getSessionExpiryByRole("ADMIN");

    await db.insert(sessions).values({
      id: createId(),
      token: sessionToken,
      userId: adminUser.id,
      expiresAt,
      ipAddress: null,
      userAgent: null,
    });

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
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
    console.error("Admin OTP verify error:", error);

    if (error && typeof error === "object" && "name" in error && error.name === "ZodError") {
      return NextResponse.json(
        { success: false, message: "Invalid input data" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, message: "An error occurred" },
      { status: 500 },
    );
  }
}
