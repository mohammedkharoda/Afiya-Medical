"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";

interface CancelAppointmentDialogProps {
  appointmentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  isDoctor?: boolean;
}

export function CancelAppointmentDialog({
  appointmentId,
  open,
  onOpenChange,
  onSuccess,
  isDoctor = false,
}: CancelAppointmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (reason.trim().length < 10) {
      toast.error("Cancellation reason must be at least 10 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/appointments/${appointmentId}/cancel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: reason.trim() }),
          credentials: "include",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel appointment");
      }

      toast.success("Appointment cancelled successfully");
      onOpenChange(false);
      onSuccess?.();
      setReason("");
    } catch (error: any) {
      console.error("Error cancelling appointment:", error);
      toast.error(error.message || "Failed to cancel appointment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Cancel Appointment
          </DialogTitle>
          <DialogDescription>
            {isDoctor
              ? "Please provide a reason for cancelling this appointment. The patient will be notified."
              : "Please provide a reason for cancelling your appointment. The doctor will be notified."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">
                Cancellation Reason *{" "}
                <span className="text-xs text-muted-foreground">
                  (minimum 10 characters)
                </span>
              </Label>
              <Textarea
                id="reason"
                placeholder="Please explain why you need to cancel this appointment..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                required
                minLength={10}
              />
              <div className="text-xs text-muted-foreground text-right">
                {reason.length}/10 characters
              </div>
            </div>

            {!isDoctor && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> Cancelling your appointment may affect
                  future bookings. Please cancel only if absolutely necessary.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Keep Appointment
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={loading || reason.trim().length < 10}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancel Appointment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
