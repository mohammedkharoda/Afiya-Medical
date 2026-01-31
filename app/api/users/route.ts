import { NextRequest, NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

// GET - List all users (for debugging)
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allUsers = await db.query.users.findMany({
      columns: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ users: allUsers });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH - Update user role
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { error: "userId and role are required" },
        { status: 400 },
      );
    }

    if (!["DOCTOR", "PATIENT"].includes(role)) {
      return NextResponse.json(
        { error: "Role must be DOCTOR or PATIENT" },
        { status: 400 },
      );
    }

    // Update the user role
    await db.update(users).set({ role: role }).where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      message: `User role updated to ${role}`,
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
