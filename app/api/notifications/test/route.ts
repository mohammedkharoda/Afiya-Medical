import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sendPushToUser } from "@/lib/pusher-beams-server";
import { triggerNotification } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await req.json();

    // Verify user is testing their own notifications (or is admin)
    if (session.user.id !== userId && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Send test push notification via Pusher Beams
    const pushSent = await sendPushToUser(
      userId,
      "Test Notification",
      "This is a test notification from Afiya. If you see this, push notifications are working!",
      "/dashboard",
      { type: "TEST" }
    );

    // Send test in-app notification via Pusher WebSocket
    await triggerNotification(userId, {
      id: `test-notification-${Date.now()}`,
      type: "GENERAL",
      title: "Test Notification",
      message: "This is a test notification. If you see this, in-app notifications are working!",
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Test notifications sent",
      pushSent,
    });
  } catch (error) {
    console.error("Error sending test notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
