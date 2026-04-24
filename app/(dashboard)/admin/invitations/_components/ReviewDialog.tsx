"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import type { VerificationRequest } from "./types";

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: VerificationRequest | null;
  mode: "approve" | "reject";
  onReviewed: () => void;
}

export function ReviewDialog({
  open,
  onOpenChange,
  target,
  mode,
  onReviewed,
}: ReviewDialogProps) {
  const [notes, setNotes] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const handleClose = (value: boolean) => {
    onOpenChange(value);
    if (!value) setNotes("");
  };

  const handleReview = async () => {
    if (!target) return;
    if (mode === "reject" && !notes.trim()) {
      toast.error("Please add a reason before rejecting this doctor");
      return;
    }

    setReviewing(true);
    try {
      const response = await fetch("/api/admin/doctor-verifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationId: target.id, action: mode, reviewNotes: notes }),
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to update doctor verification");
        return;
      }

      toast.success(mode === "approve" ? "Doctor approved successfully" : "Doctor rejected successfully");
      handleClose(false);
      onReviewed();
    } catch {
      toast.error("An error occurred while updating verification");
    } finally {
      setReviewing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "approve" ? "Approve Doctor" : "Reject Doctor"}</DialogTitle>
          <DialogDescription>
            {target
              ? `${mode === "approve" ? "Approve" : "Reject"} Dr. ${target.doctorName} after reviewing the submitted documents.`
              : "Review the selected doctor profile."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {target ? (
            <div className="rounded-2xl border border-border bg-card/60 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{target.doctorEmail}</p>
              <p className="mt-1">
                {target.speciality} • Registration No. {target.registrationNumber}
              </p>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="review-notes">
              {mode === "approve" ? "Approval Notes (Optional)" : "Rejection Reason"}
            </Label>
            <Textarea
              id="review-notes"
              placeholder={
                mode === "approve"
                  ? "Add any internal notes for this approval"
                  : "Explain what needs to be corrected before approval"
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={reviewing}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleReview}
            disabled={reviewing}
            variant={mode === "approve" ? "default" : "destructive"}
          >
            {reviewing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : mode === "approve" ? (
              "Approve Doctor"
            ) : (
              "Reject Doctor"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
