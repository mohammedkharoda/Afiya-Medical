import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db, users, verifications, patientProfiles } from "@/lib/db";
import { eq, ilike } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { registerSchema } from "@/lib/validations/auth";
import { sendOtpEmail } from "@/lib/email";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { createId } from "@paralleldrive/cuid2";
import { verifyHCaptcha } from "@/lib/hcaptcha";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const captchaToken = body?.captchaToken;
    const remoteIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;

    const captchaCheck = await verifyHCaptcha(captchaToken, remoteIp);
    if (!captchaCheck.success) {
      return NextResponse.json(
        { error: captchaCheck.error || "Captcha verification failed" },
        { status: 400 },
      );
    }

    // Validate input
    const validatedData = registerSchema.parse(body);
    const {
      name,
      email,
      password,
      phone,
      dob,
      gender,
      address,
      emergencyContact,
      bloodGroup,
      preferredDoctorId,
    } = validatedData;

    // Always register as PATIENT - doctors are created via seed script
    const role = "PATIENT";

    // Normalize and validate phone server-side (store E.164)
    const parsedPhone = parsePhoneNumberFromString(phone);
    if (!parsedPhone || !parsedPhone.isValid()) {
      return NextResponse.json(
        { error: "Invalid phone number" },
        { status: 400 },
      );
    }

    const phoneE164 = parsedPhone.format("E.164");

    // Validate emergency contact phone
    const parsedEmergency = parsePhoneNumberFromString(emergencyContact);
    if (!parsedEmergency || !parsedEmergency.isValid()) {
      return NextResponse.json(
        { error: "Invalid emergency contact number" },
        { status: 400 },
      );
    }
    const emergencyE164 = parsedEmergency.format("E.164");

    // Check if user already exists (case-insensitive)
    const existingUser = await db.query.users.findFirst({
      where: ilike(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 },
      );
    }

    // Validate preferred doctor exists if provided
    if (preferredDoctorId) {
      const doctorExists = await db.query.users.findFirst({
        where: eq(users.id, preferredDoctorId),
      });

      if (!doctorExists || doctorExists.role !== "DOCTOR") {
        return NextResponse.json(
          {
            error:
              "Selected doctor is not valid. Please select another doctor.",
          },
          { status: 400 },
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = randomUUID();

    // Create user with all custom fields (store original email case)
    const [user] = await db
      .insert(users)
      .values({
        name,
        email,
        password: hashedPassword,
        phone: phoneE164,
        role,
        verificationToken,
        isVerified: false,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isVerified: users.isVerified,
      });

    // Create patient profile with the additional information
    await db.insert(patientProfiles).values({
      userId: user.id,
      preferredDoctorId: preferredDoctorId || null,
      dob: new Date(dob),
      gender,
      address,
      emergencyContact: emergencyE164,
      bloodGroup: bloodGroup || null,
      hasCompletedMedicalHistory: false,
    });

    // Clean up any old verification records for this phone before creating new ones
    await db
      .delete(verifications)
      .where(eq(verifications.identifier, phoneE164));

    // Generate OTP and save to verifications table (phone-based verification)
    const otp = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.insert(verifications).values({
      identifier: phoneE164,
      value: otp,
      expiresAt,
    });

    // Create a short-lived token to hide phone in the verify URL
    const token = createId();
    await db
      .insert(verifications)
      .values({ identifier: token, value: phoneE164, expiresAt });

    // Send OTP via email (using original email case for delivery)
    try {
      console.log(`Sending OTP email to ${email} with code ${otp}`);
      const emailSent = await sendOtpEmail(email, otp);
      console.log(`OTP email result: ${emailSent}`);
    } catch (emailErr) {
      console.error("Failed to send OTP email:", emailErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful. An OTP has been sent to your email.",
        user,
        token,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Registration error:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 },
      );
    }

    // Handle database constraint errors
    if (error.code === "23503" || error.message?.includes("foreign key")) {
      return NextResponse.json(
        {
          error: "Selected doctor is not valid. Please refresh and try again.",
        },
        { status: 400 },
      );
    }

    if (
      error.code === "23505" ||
      error.message?.includes("unique constraint")
    ) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 },
    );
  }
}
