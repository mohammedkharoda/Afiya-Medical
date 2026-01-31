"use client";

import { useState, useEffect } from "react";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface RescheduleAppointmentDialogProps {
  appointmentId: string;
  currentDate: Date;
  currentTime: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RescheduleAppointmentDialog({
  appointmentId,
  currentDate,
  currentTime,
  open,
  onOpenChange,
  onSuccess,
}: RescheduleAppointmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate]);

  const fetchAvailableSlots = async (date: Date) => {
    setLoadingSlots(true);
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const response = await fetch(
        `/api/schedule/available-slots?date=${dateStr}`,
        { credentials: "include" },
      );

      const data = await response.json();

      if (response.ok) {
        setAvailableSlots(data.availableSlots || []);
      } else {
        toast.error("Failed to fetch available slots");
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error("Error fetching slots:", error);
      toast.error("Failed to fetch available slots");
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDate || !selectedTime) {
      toast.error("Please select both date and time");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/appointments/${appointmentId}/reschedule`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newDate: format(selectedDate, "yyyy-MM-dd"),
            newTime: selectedTime,
            reason: reason.trim() || undefined,
          }),
          credentials: "include",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reschedule appointment");
      }

      toast.success("Appointment rescheduled successfully");
      onOpenChange(false);
      onSuccess?.();

      // Reset form
      setSelectedDate(undefined);
      setSelectedTime("");
      setReason("");
    } catch (error: any) {
      console.error("Error rescheduling appointment:", error);
      toast.error(error.message || "Failed to reschedule appointment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Reschedule Appointment</DialogTitle>
          <DialogDescription>
            Select a new date and time for this appointment. The patient will be
            notified of the change.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Current appointment info */}
            <div className="rounded-lg border border-muted bg-muted/50 p-3">
              <p className="text-sm font-medium">Current Appointment</p>
              <p className="text-sm text-muted-foreground">
                {format(currentDate, "MMMM d, yyyy")} at {currentTime}
              </p>
            </div>

            {/* Date picker */}
            <div className="space-y-2">
              <Label>Select New Date *</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
                className="rounded-md border"
              />
            </div>

            {/* Time slot selector */}
            {selectedDate && (
              <div className="space-y-2">
                <Label htmlFor="time">Select New Time *</Label>
                {loadingSlots ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : availableSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    No available slots for this date
                  </p>
                ) : (
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Reason (optional) */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Rescheduling (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Explain why you're rescheduling..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !selectedDate || !selectedTime}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reschedule Appointment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
