"use client";

import { Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Appointment } from "../types";

interface CancelAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAppointment: Appointment | null;
  notes: string;
  onNotesChange: (value: string) => void;
  actionLoading: { id: string; action: string } | null;
  onKeep: () => void;
  onConfirm: (appointmentId: string, notes: string) => void;
}

export function CancelAppointmentDialog({
  open,
  onOpenChange,
  selectedAppointment,
  notes,
  onNotesChange,
  actionLoading,
  onKeep,
  onConfirm,
}: CancelAppointmentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ backgroundColor: "white" }}>
        <DialogHeader>
          <DialogTitle>Cancel Appointment</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this appointment? The patient will be
            notified. <strong>You must provide a reason for cancellation.</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Reason for cancellation <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="Please provide a reason for cancellation..."
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              rows={3}
              className={!notes.trim() ? "border-red-300" : ""}
            />
            {!notes.trim() && (
              <p className="text-xs text-red-500">
                Reason is required to cancel the appointment
              </p>
            )}
          </div>
        </div>
        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" className="w-full sm:w-auto" onClick={onKeep}>
            Keep Appointment
          </Button>
          <Button
            variant="destructive"
            className="w-full sm:w-auto"
            onClick={() =>
              selectedAppointment &&
              notes.trim() &&
              onConfirm(selectedAppointment.id, notes)
            }
            disabled={
              (selectedAppointment && actionLoading?.id === selectedAppointment.id) ||
              !notes.trim()
            }
          >
            {selectedAppointment && actionLoading?.id === selectedAppointment.id ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <XCircle className="h-4 w-4 mr-1" />
            )}
            Cancel Appointment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
