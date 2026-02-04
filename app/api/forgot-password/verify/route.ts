import { NextRequest, NextResponse } from "next/server";
import { db, verifications, users } from "@/lib/db";
import { eq, ilike } from "drizzle-orm";
import { forgotPasswordVerifySchema } from "@/lib/validations/auth";
import { createId } from "@paralleldrive/cuid2";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp } = forgotPasswordVerifySchema.parse(body);

    const identifier = `pwd-reset:${email.toLowerCase()}`;

    // Find all verification records for this identifier
    const records = await db.query.verifications.findMany({
      where: eq(verifications.identifier, identifier),
    });

    // Find the OTP record (6-digit value)
    const otpRecord = records.find((r) => /^\d{6}$/.test(r.value));

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, message: "OTP not found. Please request a new one." },
        { status: 400 },
      );
    }

    // Check expiry
    if (otpRecord.expiresAt < new Date()) {
      await db.delete(verifications).where(eq(verifications.id, otpRecord.id));
      return NextResponse.json(
        { success: false, message: "OTP expired. Please request a new one." },
        { status: 400 },
      );
    }

    // Verify OTP value
    if (otpRecord.value !== otp) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP" },
        { status: 400 },
      );
    }

    // OTP is valid — delete it (consumed)
    await db.delete(verifications).where(eq(verifications.id, otpRecord.id));

    // Verify user still exists and is PATIENT/DOCTOR
    const user = await db.query.users.findFirst({
      where: ilike(users.email, email),
    });

    if (!user || !["PATIENT", "DOCTOR"].includes(user.role)) {
      return NextResponse.json(
        { success: false, message: "Account not found" },
        { status: 404 },
      );
    }

    // Create a short-lived reset token (15 minutes)
    const resetToken = createId();
    const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

    await db.insert(verifications).values({
      identifier: `reset-token:${resetToken}`,
      value: user.id,
      expiresAt: tokenExpiry,
    });

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully",
      resetToken,
    });
  } catch (error: unknown) {
    console.error("Forgot password verify error:", error);

    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "ZodError"
    ) {
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
