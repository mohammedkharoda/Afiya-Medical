import {
  CheckCircle,
  XCircle,
  Loader2,
  CalendarDays,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Appointment } from "./types";

interface DoctorActionsProps {
  appointment: Appointment;
  actionLoading: { id: string; action: string } | null;
  onApprove: (appointmentId: string) => void;
  onDecline: (appointment: Appointment) => void;
  onStartPrescription: (appointment: Appointment) => void;
  onReschedule: (appointment: Appointment) => void;
  onCancel: (appointment: Appointment) => void;
  onRecordPayment?: (appointment: Appointment) => void;
}

export function DoctorActions({
  appointment,
  actionLoading,
  onApprove,
  onDecline,
  onStartPrescription,
  onReschedule,
  onCancel,
  onRecordPayment,
}: DoctorActionsProps) {
  // Completed appointments: Show payment status and record payment option
  if (appointment.status === "COMPLETED") {
    const hasPayment = appointment.payment;
    const isPaid = appointment.payment?.status === "PAID";
    const isPending = appointment.payment?.status === "PENDING";

    return (
      <div className="space-y-2">
        {/* Payment Status Indicator */}
        {hasPayment && (
          <div className="flex items-center gap-2">
            {isPaid ? (
              <Badge className="bg-green-100 text-green-700 text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Payment Received
              </Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-700 text-xs">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Payment Pending
              </Badge>
            )}
            {hasPayment && (
              <span className="text-xs text-muted-foreground">
                ₹{appointment.payment?.amount}
              </span>
            )}
          </div>
        )}

        {/* Record Payment Button - show if no payment or payment is pending */}
        {(!hasPayment || isPending) && onRecordPayment && (
          <div className="flex items-center gap-1.5 sm:gap-2 pt-2 border-t flex-wrap">
            <Button
              size="sm"
              onClick={() => onRecordPayment(appointment)}
              className="bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
              disabled={actionLoading?.id === appointment.id}
            >
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              {isPending ? "Update Payment" : "Record Payment"}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Pending appointments: Approve/Decline
  if (appointment.status === "PENDING") {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2 pt-2 border-t flex-wrap">
        <Button
          size="sm"
          onClick={() => onApprove(appointment.id)}
          className="bg-green-500 hover:bg-green-600 text-white text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
          disabled={actionLoading?.id === appointment.id}
        >
          {actionLoading?.id === appointment.id &&
          actionLoading?.action === "approve" ? (
            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1" />
          ) : (
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          )}
          Approve
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onDecline(appointment)}
          className="bg-red-500 hover:bg-red-600 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
          disabled={actionLoading?.id === appointment.id}
        >
          <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          Decline
        </Button>
      </div>
    );
  }

  // Scheduled/Rescheduled appointments: Start Prescription/Reschedule/Cancel
  if (
    appointment.status === "SCHEDULED" ||
    appointment.status === "RESCHEDULED"
  ) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2 pt-2 border-t flex-wrap">
        <Button
          size="sm"
          onClick={() => onStartPrescription(appointment)}
          className="bg-green-500 hover:bg-green-600 text-white text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
          disabled={actionLoading?.id === appointment.id}
        >
          {actionLoading?.id === appointment.id ? (
            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1" />
          ) : (
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          )}
          <span className="hidden xs:inline">Start Prescription</span>
          <span className="xs:hidden">Prescription</span>
        </Button>
        {/* Only show Reschedule button for SCHEDULED status - not for already rescheduled */}
        {appointment.status === "SCHEDULED" && (
          <Button
            size="sm"
            variant="outline"
            className="border-amber-500 text-amber-600 hover:bg-amber-50 hover:text-amber-700 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
            onClick={() => onReschedule(appointment)}
            disabled={actionLoading?.id === appointment.id}
          >
            {actionLoading?.id === appointment.id ? (
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1" />
            ) : (
              <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            )}
            Reschedule
          </Button>
        )}
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onCancel(appointment)}
          className="bg-red-500 hover:bg-red-600 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
          disabled={actionLoading?.id === appointment.id}
        >
          {actionLoading?.id === appointment.id ? (
            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1" />
          ) : (
            <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          )}
          Cancel
        </Button>
      </div>
    );
  }

  return null;
}
