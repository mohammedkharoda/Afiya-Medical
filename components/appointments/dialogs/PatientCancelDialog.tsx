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

interface PatientCancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAppointment: Appointment | null;
  notes: string;
  onNotesChange: (value: string) => void;
  actionLoading: { id: string; action: string } | null;
  onKeep: () => void;
  onConfirm: (appointmentId: string, notes: string) => void;
}

export function PatientCancelDialog({
  open,
  onOpenChange,
  selectedAppointment,
  notes,
  onNotesChange,
  actionLoading,
  onKeep,
  onConfirm,
}: PatientCancelDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ backgroundColor: "white" }}>
        <DialogHeader>
          <DialogTitle>Cancel Your Appointment</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this appointment? The doctor will be
            notified. <strong>Please provide a reason for cancellation.</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-700">
              <strong>Note:</strong> Cancelling an appointment may affect future
              scheduling. Please try to cancel at least 24 hours in advance.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Reason for cancellation <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="Please provide a reason for cancelling..."
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
          <Button variant="outline" className="w-full sm:w-auto" onClick={onKeep}>
            Keep Appointment
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
            Cancel Appointment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
