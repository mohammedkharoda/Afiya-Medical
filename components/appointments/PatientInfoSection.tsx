import { User, Phone, FileText } from "lucide-react";
import { Appointment } from "./types";

interface PatientInfoSectionProps {
  appointment: Appointment;
}

export function PatientInfoSection({ appointment }: PatientInfoSectionProps) {
  if (!appointment.patient?.user) return null;

  return (
    <div className="bg-accent/30 rounded-lg p-2 sm:p-3 space-y-1.5 sm:space-y-2">
      <div className="flex items-center gap-2">
        <User
          size={14}
          className="text-muted-foreground shrink-0 sm:w-4 sm:h-4"
        />
        <span className="font-medium text-sm sm:text-base truncate">
          {appointment.patient.user.name || "Unknown Patient"}
        </span>
      </div>
      {appointment.patient.user.phone && (
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <Phone size={12} className="shrink-0 sm:w-3.5 sm:h-3.5" />
          <span>{appointment.patient.user.phone}</span>
        </div>
      )}
      {appointment.symptoms && (
        <div className="flex items-start gap-2 text-xs sm:text-sm">
          <FileText
            size={12}
            className="text-muted-foreground mt-0.5 shrink-0 sm:w-3.5 sm:h-3.5"
          />
          <span className="text-muted-foreground">
            <strong>Symptoms:</strong> {appointment.symptoms}
          </span>
        </div>
      )}
    </div>
  );
}
