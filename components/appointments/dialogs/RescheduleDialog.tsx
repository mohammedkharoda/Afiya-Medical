"use client";

import { CalendarDays, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Appointment } from "../types";

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAppointment: Appointment | null;
  rescheduleDate: string;
  rescheduleTime: string;
  notes: string;
  onRescheduleDateChange: (value: string) => void;
  onRescheduleTimeChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  actionLoading: { id: string; action: string } | null;
  onCancel: () => void;
  onReschedule: () => void;
}

export function RescheduleDialog({
  open,
  onOpenChange,
  selectedAppointment,
  rescheduleDate,
  rescheduleTime,
  notes,
  onRescheduleDateChange,
  onRescheduleTimeChange,
  onNotesChange,
  actionLoading,
  onCancel,
  onReschedule,
}: RescheduleDialogProps) {
  const minDate = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ backgroundColor: "white" }}>
        <DialogHeader>
          <DialogTitle>Reschedule Appointment</DialogTitle>
          <DialogDescription>
            Select a new date and time for this appointment. The patient will be
            notified.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              New Date <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={rescheduleDate}
              onChange={(e) => onRescheduleDateChange(e.target.value)}
              min={minDate}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              New Time <span className="text-red-500">*</span>
            </label>
            <Input
              type="time"
              value={rescheduleTime}
              onChange={(e) => onRescheduleTimeChange(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Reason for rescheduling (optional)
            </label>
            <Textarea
              placeholder="Add a note about why you're rescheduling..."
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              rows={2}
            />
          </div>
        </div>
        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" className="w-full sm:w-auto" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-white border-none w-full sm:w-auto"
            onClick={onReschedule}
            disabled={
              (selectedAppointment && actionLoading?.id === selectedAppointment.id) ||
              !rescheduleDate ||
              !rescheduleTime
            }
          >
            {selectedAppointment && actionLoading?.id === selectedAppointment.id ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <CalendarDays className="h-4 w-4 mr-1" />
            )}
            Reschedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
