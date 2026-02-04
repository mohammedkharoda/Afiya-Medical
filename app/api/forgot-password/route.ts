import { NextRequest, NextResponse } from "next/server";
import { db, verifications, users } from "@/lib/db";
import { eq, ilike } from "drizzle-orm";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { sendOtpEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = forgotPasswordSchema.parse(body);

    // Find user by email (case-insensitive)
    const user = await db.query.users.findFirst({
      where: ilike(users.email, email),
    });

    // Always return same message to prevent email enumeration
    if (!user || !["PATIENT", "DOCTOR"].includes(user.role)) {
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, an OTP has been sent.",
      });
    }

    // Must be verified to reset password
    if (!user.isVerified) {
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, an OTP has been sent.",
      });
    }

    const identifier = `pwd-reset:${user.email.toLowerCase()}`;

    // Rate-limit: check for recent OTP (within 60 seconds)
    const existingRecords = await db.query.verifications.findMany({
      where: eq(verifications.identifier, identifier),
    });

    const otpRecords = existingRecords.filter((r) => /^\d{6}$/.test(r.value));
    const mostRecent = otpRecords.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];

    if (mostRecent) {
      const age = Date.now() - new Date(mostRecent.createdAt).getTime();
      if (age < 60 * 1000) {
        return NextResponse.json(
          {
            success: false,
            message: "Please wait before requesting another code",
          },
          { status: 429 },
        );
      }
    }

    // Clean up old OTP records for this identifier
    for (const rec of otpRecords) {
      await db.delete(verifications).where(eq(verifications.id, rec.id));
    }

    // Generate and store OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.insert(verifications).values({
      identifier,
      value: otp,
      expiresAt,
    });

    // Send OTP email
    await sendOtpEmail(user.email, otp);

    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, an OTP has been sent.",
    });
  } catch (error: unknown) {
    console.error("Forgot password error:", error);

    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "ZodError"
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid email address" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, message: "An error occurred" },
      { status: 500 },
    );
  }
}
