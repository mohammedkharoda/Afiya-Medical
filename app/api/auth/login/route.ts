import { NextRequest, NextResponse } from "next/server";
import { db, users, sessions, doctorVerifications } from "@/lib/db";
import { eq, ilike } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/validations/auth";
import { createId } from "@paralleldrive/cuid2";
import { getSessionExpiryByRole, type UserRole } from "@/lib/session-utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const validatedData = loginSchema.parse(body);
    const { email, password } = validatedData;

    // Find user by email (case-insensitive)
    const user = await db.query.users.findFirst({
      where: ilike(users.email, email),
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    if (!user.password) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Verify password with bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Check if email is verified
    if (!user.isVerified) {
      if (user.role === "DOCTOR") {
        const verification = await db.query.doctorVerifications.findFirst({
          where: eq(doctorVerifications.userId, user.id),
        });

        if (verification?.status === "REJECTED") {
          return NextResponse.json(
            {
              error: verification.reviewNotes
                ? `Your doctor profile was rejected: ${verification.reviewNotes}`
                : "Your doctor profile was rejected by the admin team. Please contact the admin.",
            },
            { status: 403 },
          );
        }

        return NextResponse.json(
          {
            error:
              "Your doctor profile is pending admin approval. Please wait until your documents are reviewed.",
          },
          { status: 403 },
        );
      }

      return NextResponse.json(
        { error: "Please verify your email before logging in" },
        { status: 403 },
      );
    }

    // Create session with role-based expiry
    const sessionToken = createId();
    const expiresAt = getSessionExpiryByRole(user.role as UserRole);

    await db.insert(sessions).values({
      id: createId(),
      token: sessionToken,
      userId: user.id,
      expiresAt,
      ipAddress:
        req.headers.get("x-forwarded-for") ||
        req.headers.get("x-real-ip") ||
        null,
      userAgent: req.headers.get("user-agent") || null,
    });

    // Create response with session cookie
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      {
        headers: {
          // Prevent caching of login response
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );

    // Set session cookie
    response.cookies.set("better-auth.session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 },
    );
  }
}
