import { AppointmentHeader } from "./AppointmentHeader";
import { PatientInfoSection } from "./PatientInfoSection";
import { AppointmentIndicators } from "./AppointmentIndicators";
import { DoctorActions } from "./DoctorActions";
import { PatientInfoPanels } from "./PatientInfoPanels";
import { PatientActions } from "./PatientActions";
import { Appointment } from "./types";

interface AppointmentCardProps {
  appointment: Appointment;
  isDoctor: boolean;
  actionLoading: { id: string; action: string } | null;
  onApprove: (appointmentId: string) => void;
  onApproveVideo: (appointment: Appointment) => void;
  onDecline: (appointment: Appointment) => void;
  onStartPrescription: (appointment: Appointment) => void;
  onReschedule: (appointment: Appointment) => void;
  onCancelDoctor: (appointment: Appointment) => void;
  onCancelPatient: (appointment: Appointment) => void;
  onViewDetails: (appointment: Appointment) => void;
  onRecordPayment?: (appointment: Appointment) => void;
}

export function AppointmentCard({
  appointment,
  isDoctor,
  actionLoading,
  onApprove,
  onApproveVideo,
  onDecline,
  onStartPrescription,
  onReschedule,
  onCancelDoctor,
  onCancelPatient,
  onViewDetails,
  onRecordPayment,
}: AppointmentCardProps) {
  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-card p-4 shadow-sm sm:space-y-4 sm:p-5">
      {/* Header Row */}
      <AppointmentHeader
        appointmentDate={appointment.appointmentDate}
        appointmentTime={appointment.appointmentTime}
        status={appointment.status}
      />

      {/* Doctor View: Patient Info */}
      {isDoctor && <PatientInfoSection appointment={appointment} />}

      {/* Doctor View: Rescheduled/Cancelled indicators */}
      {isDoctor && (
        <AppointmentIndicators appointment={appointment} isDoctor={isDoctor} />
      )}

      {/* Doctor Actions */}
      {isDoctor && (
        <DoctorActions
          appointment={appointment}
          actionLoading={actionLoading}
          onApprove={onApprove}
          onApproveVideo={onApproveVideo}
          onDecline={onDecline}
          onStartPrescription={onStartPrescription}
          onReschedule={onReschedule}
          onCancel={onCancelDoctor}
          onRecordPayment={onRecordPayment}
        />
      )}

      {/* Patient Info Panels */}
      {!isDoctor && <PatientInfoPanels appointment={appointment} />}

      {/* Patient Actions */}
      {!isDoctor && (
        <PatientActions
          appointment={appointment}
          actionLoading={actionLoading}
          onCancel={onCancelPatient}
          onViewDetails={onViewDetails}
          doctorName={appointment.doctorName || "Doctor"}
          doctorUpiId={appointment.doctorUpiId || ""}
          doctorUpiQrCode={appointment.doctorUpiQrCode}
        />
      )}
    </div>
  );
}
