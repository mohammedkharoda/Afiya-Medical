import { NextRequest, NextResponse } from "next/server";
import { db, verifications, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { resetPasswordSchema } from "@/lib/validations/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = resetPasswordSchema.parse(body);

    // Look up the reset token
    const tokenRecord = await db.query.verifications.findFirst({
      where: eq(verifications.identifier, `reset-token:${token}`),
    });

    if (!tokenRecord) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired reset token. Please start over.",
        },
        { status: 400 },
      );
    }

    // Check expiry
    if (tokenRecord.expiresAt < new Date()) {
      await db
        .delete(verifications)
        .where(eq(verifications.id, tokenRecord.id));
      return NextResponse.json(
        {
          success: false,
          message: "Reset token expired. Please start over.",
        },
        { status: 400 },
      );
    }

    const userId = tokenRecord.value;

    // Verify user exists and is PATIENT/DOCTOR
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user || !["PATIENT", "DOCTOR"].includes(user.role)) {
      await db
        .delete(verifications)
        .where(eq(verifications.id, tokenRecord.id));
      return NextResponse.json(
        { success: false, message: "Account not found" },
        { status: 404 },
      );
    }

    // Hash new password (bcrypt with 10 salt rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password in users table
    await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, userId));

    // Delete the consumed reset token
    await db
      .delete(verifications)
      .where(eq(verifications.id, tokenRecord.id));

    // Clean up any remaining pwd-reset OTP records for this user
    const pwdResetIdentifier = `pwd-reset:${user.email.toLowerCase()}`;
    await db
      .delete(verifications)
      .where(eq(verifications.identifier, pwdResetIdentifier));

    return NextResponse.json({
      success: true,
      message:
        "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error: unknown) {
    console.error("Reset password error:", error);

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
