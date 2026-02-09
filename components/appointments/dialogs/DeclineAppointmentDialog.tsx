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

interface DeclineAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAppointment: Appointment | null;
  notes: string;
  onNotesChange: (value: string) => void;
  actionLoading: { id: string; action: string } | null;
  onBack: () => void;
  onConfirm: (appointmentId: string, notes: string) => void;
}

export function DeclineAppointmentDialog({
  open,
  onOpenChange,
  selectedAppointment,
  notes,
  onNotesChange,
  actionLoading,
  onBack,
  onConfirm,
}: DeclineAppointmentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ backgroundColor: "white" }}>
        <DialogHeader>
          <DialogTitle>Decline Appointment Request</DialogTitle>
          <DialogDescription>
            Are you sure you want to decline this appointment request? The
            patient will be notified.{" "}
            <strong>Please provide a reason for declining.</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Reason for declining <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="e.g., Schedule conflict, please try a different time slot..."
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              rows={3}
              className={notes.trim().length < 10 ? "border-red-300" : ""}
            />
            {notes.trim().length < 10 && (
              <p className="text-xs text-red-500">
                Reason must be at least 10 characters
              </p>
            )}
          </div>
        </div>
        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" className="w-full sm:w-auto" onClick={onBack}>
            Go Back
          </Button>
          <Button
            variant="destructive"
            className="w-full sm:w-auto"
            onClick={() =>
              selectedAppointment && onConfirm(selectedAppointment.id, notes)
            }
            disabled={
              (selectedAppointment && actionLoading?.id === selectedAppointment.id) ||
              notes.trim().length < 10
            }
          >
            {selectedAppointment && actionLoading?.id === selectedAppointment.id ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <XCircle className="h-4 w-4 mr-1" />
            )}
            Decline Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
