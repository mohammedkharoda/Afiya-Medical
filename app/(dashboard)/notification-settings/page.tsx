"use client";

import { useSession } from "@/lib/auth-client";
import { NotificationDiagnostics } from "@/components/notification-diagnostics";
import { Bell } from "lucide-react";

export default function NotificationSettingsPage() {
  const { data: session } = useSession();

  if (!session?.user?.id) {
    return <div>Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Bell className="h-8 w-8" />
          Notification Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage and test your push notifications
        </p>
      </div>

      <NotificationDiagnostics userId={session.user.id} />
    </div>
  );
}
