import { CalendarDays, XCircle } from "lucide-react";
import { formatDate } from "./utils";
import { Appointment } from "./types";

interface AppointmentIndicatorsProps {
  appointment: Appointment;
  isDoctor: boolean;
}

export function AppointmentIndicators({
  appointment,
  isDoctor,
}: AppointmentIndicatorsProps) {
  return (
    <>
      {/* Doctor View: Rescheduled indicator */}
      {isDoctor &&
        appointment.status === "RESCHEDULED" &&
        appointment.originalAppointmentDate && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
            <p className="text-xs text-amber-700">
              <CalendarDays className="inline h-3 w-3 mr-1" />
              Originally: {formatDate(appointment.originalAppointmentDate)}
              {appointment.originalAppointmentTime &&
                ` at ${appointment.originalAppointmentTime}`}
            </p>
          </div>
        )}

      {/* Doctor View: Cancelled indicator */}
      {isDoctor && appointment.status === "CANCELLED" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2">
          <p className="text-xs text-red-700">
            <XCircle className="inline h-3 w-3 mr-1" />
            This appointment has been cancelled
            {appointment.notes && (
              <span className="block mt-1 text-red-600">
                Reason: {appointment.notes}
              </span>
            )}
          </p>
        </div>
      )}
    </>
  );
}
