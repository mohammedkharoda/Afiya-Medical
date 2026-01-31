import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getSession(req);

  if (!session) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  return NextResponse.json({
    valid: true,
    expiresAt: session.session.expiresAt,
    role: session.user.role,
  });
}
