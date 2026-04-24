"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import type { Doctor, Invitation } from "./types";

interface DeleteDoctorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctor: Doctor | null;
  invitation: Invitation | null;
  onDeleted: (result: {
    deletedDoctorId: string | null;
    deletedInvitationIds: string[];
    deletedEmail: string | null;
  }) => void;
}

export function DeleteDoctorDialog({
  open,
  onOpenChange,
  doctor,
  invitation,
  onDeleted,
}: DeleteDoctorDialogProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!doctor && !invitation) return;
    setDeleting(true);

    try {
      const url = invitation
        ? `/api/admin/doctors?email=${encodeURIComponent(invitation.email)}`
        : `/api/admin/doctors?id=${doctor!.id}`;

      const response = await fetch(url, { method: "DELETE", credentials: "include" });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to delete doctor");
        return;
      }

      toast.success("Doctor deleted successfully");
      onOpenChange(false);
      onDeleted({
        deletedDoctorId: typeof data.deletedDoctorId === "string" ? data.deletedDoctorId : null,
        deletedInvitationIds: Array.isArray(data.deletedInvitationIds) ? data.deletedInvitationIds : [],
        deletedEmail: typeof data.deletedEmail === "string" ? data.deletedEmail.toLowerCase() : null,
      });
    } catch {
      toast.error("An error occurred while deleting the doctor");
    } finally {
      setDeleting(false);
    }
  };

  const displayName = doctor?.name || invitation?.name || invitation?.email;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Doctor</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              <p>
                Are you sure you want to delete <strong>Dr. {displayName}</strong>? This action
                cannot be undone.
              </p>
              <p className="mt-3">This will also:</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                <li>Remove the doctor account and profile</li>
                <li>Cancel their pending appointments</li>
                <li>Delete their saved schedule</li>
                <li>Clear preferred doctor links from patients</li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-500 text-white hover:bg-red-600"
          >
            {deleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Doctor"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
