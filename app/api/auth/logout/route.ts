import { NextRequest, NextResponse } from "next/server";
import { db, sessions } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    // Get the session token from cookie
    const sessionToken = req.cookies.get("better-auth.session_token")?.value;

    // Delete session from database if token exists
    if (sessionToken) {
      await db.delete(sessions).where(eq(sessions.token, sessionToken));
    }

    // Create response with no-cache headers
    const response = NextResponse.json(
      { success: true },
      {
        headers: {
          // Prevent caching of logout response
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );

    // Clear the cookie with all necessary attributes for production
    const isProduction = process.env.NODE_ENV === "production";

    // Set cookie to expire immediately
    response.cookies.set("better-auth.session_token", "", {
      expires: new Date(0),
      path: "/",
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);

    // Still try to clear cookie even on error
    const response = NextResponse.json(
      { success: false, error: "Logout failed" },
      {
        status: 500,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );

    response.cookies.set("better-auth.session_token", "", {
      expires: new Date(0),
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return response;
  }
}
