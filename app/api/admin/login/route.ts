import { NextRequest, NextResponse } from "next/server";
import { db, users, verifications } from "@/lib/db";
import { eq, ilike } from "drizzle-orm";
import { adminLoginSchema } from "@/lib/validations/auth";
import { sendOtpEmail } from "@/lib/email";

// Fixed admin email
const ADMIN_EMAIL = "kharodawalam@gmail.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const validatedData = adminLoginSchema.parse(body);
    const { email } = validatedData;

    // Verify this is the admin email
    if (email.toLowerCase().trim() !== ADMIN_EMAIL) {
      return NextResponse.json(
        { success: false, message: "Invalid admin email" },
        { status: 403 },
      );
    }

    // Check if admin user exists (case-insensitive)
    const adminUser = await db.query.users.findFirst({
      where: ilike(users.email, ADMIN_EMAIL),
    });

    if (!adminUser) {
      return NextResponse.json(
        { success: false, message: "Admin account not found. Please run the seed script." },
        { status: 404 },
      );
    }

    // Verify user is an admin
    if (adminUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "User is not an admin" },
        { status: 403 },
      );
    }

    // Check for rate limiting (60 seconds between OTP requests)
    const recentOtp = await db.query.verifications.findFirst({
      where: eq(verifications.identifier, `admin:${ADMIN_EMAIL}`),
    });

    if (recentOtp) {
      const timeSinceLastOtp = Date.now() - recentOtp.createdAt.getTime();
      if (timeSinceLastOtp < 60000) {
        const remainingSeconds = Math.ceil((60000 - timeSinceLastOtp) / 1000);
        return NextResponse.json(
          {
            success: false,
            message: `Please wait ${remainingSeconds} seconds before requesting a new OTP`,
          },
          { status: 429 },
        );
      }
      // Delete old OTP
      await db.delete(verifications).where(eq(verifications.id, recentOtp.id));
    }

    // Generate OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in verifications table
    await db.insert(verifications).values({
      identifier: `admin:${ADMIN_EMAIL}`,
      value: otp,
      expiresAt,
    });

    // Send OTP via email (use original email case for delivery)
    const emailSent = await sendOtpEmail(email, otp);

    if (!emailSent) {
      console.error("Failed to send admin OTP email");
      // Still return success to not leak information
    }

    console.log(`Admin OTP sent to ${email}`);

    return NextResponse.json({
      success: true,
      message: "OTP sent to your email",
    });
  } catch (error: unknown) {
    console.error("Admin login error:", error);

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
