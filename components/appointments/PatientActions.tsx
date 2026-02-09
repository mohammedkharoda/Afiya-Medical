import { XCircle, Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Appointment } from "./types";

interface PatientActionsProps {
  appointment: Appointment;
  actionLoading: { id: string; action: string } | null;
  onCancel: (appointment: Appointment) => void;
  onViewDetails: (appointment: Appointment) => void;
}

export function PatientActions({
  appointment,
  actionLoading,
  onCancel,
  onViewDetails,
}: PatientActionsProps) {
  // Cancel button for SCHEDULED appointments
  if (appointment.status === "SCHEDULED") {
    return (
      <div className="flex items-center gap-2 pt-2 border-t mt-2">
        <Button
          size="sm"
          variant="destructive"
          className="bg-red-500 hover:bg-red-600 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
          onClick={() => onCancel(appointment)}
          disabled={actionLoading?.id === appointment.id}
        >
          {actionLoading?.id === appointment.id ? (
            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1" />
          ) : (
            <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          )}
          Cancel Appointment
        </Button>
      </div>
    );
  }

  // View Details button for COMPLETED appointments
  if (appointment.status === "COMPLETED") {
    return (
      <div className="flex items-center gap-2 pt-2 border-t mt-2">
        <Button
          size="sm"
          variant="outline"
          className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
          onClick={() => onViewDetails(appointment)}
        >
          <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          <span className="hidden sm:inline">View Details & Prescription</span>
          <span className="sm:hidden">View Details</span>
        </Button>
      </div>
    );
  }

  return null;
}
