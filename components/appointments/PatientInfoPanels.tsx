import { Clock, XCircle, CalendarDays, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "./utils";
import { Appointment } from "./types";

interface PatientInfoPanelsProps {
  appointment: Appointment;
}

export function PatientInfoPanels({ appointment }: PatientInfoPanelsProps) {
  return (
    <>
      {/* Patient: Pending Approval Info */}
      {appointment.status === "PENDING" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 sm:p-3 space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between gap-2 text-yellow-700">
            <div className="flex items-center gap-2">
              <Clock size={14} className="shrink-0" />
              <span className="font-medium text-xs sm:text-sm">
                Awaiting Doctor Approval
              </span>
            </div>
            <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200 text-[10px] sm:text-xs px-2 py-0.5">
              Wait 10 min
            </Badge>
          </div>
          <p className="text-xs text-yellow-600">
            Your appointment request is pending. The doctor will review it and
            update you once approved. After 10 minutes please refresh and check
            again, and keep an eye on your email for confirmation.
          </p>
        </div>
      )}

      {/* Patient: Declined Appointment Info */}
      {appointment.status === "DECLINED" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3 space-y-1.5 sm:space-y-2">
          <div className="flex items-center gap-2 text-red-700">
            <XCircle size={14} className="shrink-0" />
            <span className="font-medium text-xs sm:text-sm">
              Appointment Declined
            </span>
          </div>
          <p className="text-xs text-red-600">
            Your appointment request was declined by the doctor. Please try
            booking a different time slot.
          </p>
        </div>
      )}

      {/* Patient: Rescheduled Appointment Info */}
      {appointment.status === "RESCHEDULED" && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 sm:p-3 space-y-1.5 sm:space-y-2">
          <div className="flex items-start sm:items-center gap-2 text-amber-700">
            <CalendarDays size={14} className="shrink-0 mt-0.5 sm:mt-0" />
            <span className="font-medium text-xs sm:text-sm">
              This appointment has been rescheduled by the doctor
            </span>
          </div>
          {appointment.originalAppointmentDate && (
            <p className="text-xs text-amber-600">
              Originally:{" "}
              <span className="font-medium">
                {formatDate(appointment.originalAppointmentDate)}
                {appointment.originalAppointmentTime &&
                  ` at ${appointment.originalAppointmentTime}`}
              </span>
            </p>
          )}
          <p className="text-xs text-amber-700 font-medium">
            New: {formatDate(appointment.appointmentDate)} at{" "}
            {appointment.appointmentTime}
          </p>
        </div>
      )}

      {/* Patient: Symptoms display */}
      {appointment.symptoms && (
        <div className="bg-accent/30 rounded-lg p-2 sm:p-3">
          <div className="flex items-start gap-2 text-xs sm:text-sm">
            <FileText
              size={12}
              className="text-muted-foreground mt-0.5 shrink-0 sm:w-3.5 sm:h-3.5"
            />
            <span className="text-muted-foreground">
              <strong>Your symptoms:</strong> {appointment.symptoms}
            </span>
          </div>
        </div>
      )}

      {appointment.doctorPublicId ? (
        <div className="rounded-lg border border-border/70 bg-background/80 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Doctor ID: {appointment.doctorPublicId}
        </div>
      ) : null}
    </>
  );
}
