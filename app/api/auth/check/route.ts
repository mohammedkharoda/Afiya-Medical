import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({
        authenticated: false,
        message: "No session found"
      });
    }

    return NextResponse.json({
      authenticated: true,
      session: {
        userId: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
      },
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { error: "Auth check failed", details: String(error) },
      { status: 500 }
    );
  }
}
