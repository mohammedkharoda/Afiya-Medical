"use client";

import { Video, ExternalLink, Clock, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";

interface JoinMeetingButtonProps {
  appointmentId: string;
  appointmentDate: Date;
  appointmentTime: string;
  meetingUrl?: string | null;
  depositPaid: boolean;
}

export function JoinMeetingButton({
  appointmentId,
  appointmentDate,
  appointmentTime,
  meetingUrl,
  depositPaid,
}: JoinMeetingButtonProps) {
  const [loading, setLoading] = useState(false);
  const [meetingPassword, setMeetingPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Parse appointment date and time
  const appointmentDateTime = new Date(
    `${appointmentDate.toISOString().split("T")[0]} ${appointmentTime}`,
  );

  const now = new Date();
  const earlyJoinMinutes = 15; // From env: VIDEO_CALL_EARLY_JOIN_MINUTES
  const earlyJoinTime = new Date(
    appointmentDateTime.getTime() - earlyJoinMinutes * 60 * 1000,
  );
  const lateJoinTime = new Date(
    appointmentDateTime.getTime() + 120 * 60 * 1000,
  ); // 2 hours after

  const minutesUntilAppointment = Math.floor(
    (appointmentDateTime.getTime() - now.getTime()) / 60000,
  );
  const canJoin = now >= earlyJoinTime && now <= lateJoinTime;

  const handleJoin = async () => {
    if (!depositPaid) {
      toast.error("Please complete deposit payment first");
      return;
    }

    if (!canJoin) {
      if (now < earlyJoinTime) {
        toast.error(
          `Video call will be available ${minutesUntilAppointment} minutes before appointment`,
        );
      } else {
        toast.error("Video call time has expired");
      }
      return;
    }

    setLoading(true);
    try {
      // Get or generate meeting link
      let finalMeetingUrl = meetingUrl;
      if (!finalMeetingUrl) {
        const response = await fetch(
          `/api/appointments/${appointmentId}/video/meeting-link`,
        );
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to get meeting link");
        }
        const data = await response.json();
        finalMeetingUrl = data.meetingUrl;

        // Store password for display
        if (data.meetingPassword) {
          setMeetingPassword(data.meetingPassword);
        }
      }

      if (!finalMeetingUrl) {
        throw new Error("Meeting link unavailable");
      }

      // Open in new tab
      window.open(finalMeetingUrl, "_blank");
      toast.success("Opening meeting in new tab");
    } catch (error) {
      console.error("Error joining meeting:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to join meeting",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = async () => {
    if (meetingPassword) {
      await navigator.clipboard.writeText(meetingPassword);
      setCopied(true);
      toast.success("Password copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Show different states based on time and payment status
  if (!depositPaid) {
    return (
      <Badge
        variant="outline"
        className="gap-1 text-amber-600 border-amber-300"
      >
        <Video className="h-3 w-3" />
        Deposit payment required
      </Badge>
    );
  }

  if (!canJoin) {
    if (now < earlyJoinTime) {
      return (
        <Badge variant="outline" className="gap-1 rounded-full">
          <Clock className="h-3 w-3" />
          Available {earlyJoinMinutes} min before appointment
        </Badge>
      );
    } else {
      return (
        <Badge
          variant="outline"
          className="gap-1 rounded-full border-muted-foreground/40 text-muted-foreground"
        >
          <Video className="h-3 w-3" />
          Meeting expired
        </Badge>
      );
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Button
        onClick={handleJoin}
        disabled={loading}
        className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md hover:from-green-600 hover:to-emerald-600 hover:shadow-lg transition-all duration-200 font-medium"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <Video className="h-4 w-4" />
            Join Video Meeting
            <ExternalLink className="h-3 w-3" />
          </>
        )}
      </Button>

      {meetingPassword && (
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-md px-3 py-2 shadow-sm">
          <span className="text-xs text-muted-foreground">Password:</span>
          <code className="text-sm font-mono font-semibold text-gray-900">
            {meetingPassword}
          </code>
          <button
            onClick={handleCopyPassword}
            className="ml-1 p-1 hover:bg-gray-100 rounded transition-colors"
            title="Copy password"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-600" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-gray-600" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
