"use client";

import { CheckCircle, Loader2 } from "lucide-react";
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
import { Appointment } from "../types";

interface ApproveVideoConsultationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAppointment: Appointment | null;
  feeAmount: string;
  onFeeAmountChange: (value: string) => void;
  actionLoading: { id: string; action: string } | null;
  onCancel: () => void;
  onConfirm: (appointmentId: string, feeAmount: number) => void;
}

export function ApproveVideoConsultationDialog({
  open,
  onOpenChange,
  selectedAppointment,
  feeAmount,
  onFeeAmountChange,
  actionLoading,
  onCancel,
  onConfirm,
}: ApproveVideoConsultationDialogProps) {
  const parsedAmount = Number(feeAmount);
  const isValidAmount = Number.isFinite(parsedAmount) && parsedAmount > 0;
  const depositAmount = isValidAmount ? parsedAmount * 0.5 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ backgroundColor: "white" }}>
        <DialogHeader>
          <DialogTitle>Approve Video Consultation</DialogTitle>
          <DialogDescription>
            Enter the total video consultation fee. The patient will pay 50% now
            and 50% after consultation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Total Consultation Fee <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              min="1"
              step="0.01"
              placeholder="Enter total amount"
              value={feeAmount}
              onChange={(event) => onFeeAmountChange(event.target.value)}
              className={!isValidAmount && feeAmount ? "border-red-300" : ""}
            />
            {!isValidAmount && feeAmount && (
              <p className="text-xs text-red-500">
                Please enter a valid amount greater than 0
              </p>
            )}
          </div>

          {isValidAmount && (
            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              <p>
                Deposit now: <strong>{"\u20B9"}{depositAmount.toLocaleString("en-IN")}</strong>
              </p>
              <p>
                Remaining later: <strong>{"\u20B9"}{depositAmount.toLocaleString("en-IN")}</strong>
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
            disabled={
              !selectedAppointment ||
              (selectedAppointment &&
                actionLoading?.id === selectedAppointment.id &&
                actionLoading?.action === "approve") ||
              !isValidAmount
            }
            onClick={() => {
              if (selectedAppointment && isValidAmount) {
                onConfirm(selectedAppointment.id, parsedAmount);
              }
            }}
          >
            {selectedAppointment &&
            actionLoading?.id === selectedAppointment.id &&
            actionLoading?.action === "approve" ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-1" />
            )}
            Approve & Share Amount
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
