import { NextRequest, NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Session user:", session.user);

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        image: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    console.log("Database user:", user);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching current user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
