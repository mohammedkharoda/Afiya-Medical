"use client";

import { CancelAppointmentDialog } from "@/components/appointments/dialogs/CancelAppointmentDialog";
import { DeclineAppointmentDialog } from "@/components/appointments/dialogs/DeclineAppointmentDialog";
import { PatientCancelDialog } from "@/components/appointments/dialogs/PatientCancelDialog";
import { PaymentDialog } from "@/components/appointments/dialogs/PaymentDialog";
import { PrescriptionDialog } from "@/components/appointments/dialogs/PrescriptionDialog";
import { RescheduleDialog } from "@/components/appointments/dialogs/RescheduleDialog";
import { ViewPrescriptionDialog } from "@/components/appointments/dialogs/ViewPrescriptionDialog";
import { AppointmentCard } from "@/components/appointments/AppointmentCard";
import { PageHeader } from "@/components/appointments/PageHeader";
import { formatInputDate, parseLocalDate } from "@/components/appointments/utils";
import { useAppointmentsData } from "@/hooks/appointments/useAppointmentsData";
import { useUserData } from "@/hooks/appointments/useUserData";
import { usePrescriptionForm } from "@/hooks/appointments/usePrescriptionForm";
import { useDialogState } from "@/hooks/appointments/useDialogState";
import { useAppointmentActions } from "@/hooks/appointments/useAppointmentActions";
import { usePaymentFlow } from "@/hooks/appointments/usePaymentFlow";
import { useDateSummary } from "@/hooks/appointments/useDateSummary";

export default function AppointmentsPage() {
  // Data hooks
  const {
    appointments,
    setAppointments,
    loading: appointmentsLoading,
    isRefreshing,
    fetchAppointments,
    handleRefresh,
  } = useAppointmentsData();

  const { userData, doctorProfile, loading: userLoading, isDoctor } = useUserData();

  // Form state hooks
  const prescriptionForm = usePrescriptionForm();
  const dialogState = useDialogState();

  // Date summary hook
  const dateSummary = useDateSummary(appointments);

  // Action handlers
  const appointmentActions = useAppointmentActions({
    setAppointments,
    fetchAppointments,
    setDialogType: dialogState.setDialogType,
    setSelectedAppointment: dialogState.setSelectedAppointment,
    setNotes: dialogState.setNotes,
    setCompletedAppointmentId: dialogState.setCompletedAppointmentId,
  });

  // Payment flow
  const paymentFlow = usePaymentFlow({
    completedAppointmentId: dialogState.completedAppointmentId,
    paymentAmount: dialogState.paymentAmount,
    createdPaymentId: dialogState.createdPaymentId,
    setSendingInvoice: dialogState.setSendingInvoice,
    setCreatedPaymentId: dialogState.setCreatedPaymentId,
    setPaymentStep: dialogState.setPaymentStep,
    setDialogType: dialogState.setDialogType,
    setCompletedAppointmentId: dialogState.setCompletedAppointmentId,
    setPaymentAmount: dialogState.setPaymentAmount,
    setCopiedUPI: dialogState.setCopiedUPI,
    fetchAppointments,
  });

  // Computed values
  const followUpSelectedDate = prescriptionForm.followUpDate
    ? parseLocalDate(prescriptionForm.followUpDate)
    : undefined;

  const completedAppointment = dialogState.completedAppointmentId
    ? appointments.find(
        (appointment) => appointment.id === dialogState.completedAppointmentId,
      )
    : null;

  const completedPatientName =
    completedAppointment?.patient?.user?.name || "Patient";

  // Handler wrappers for dialog actions
  const handleCompleteWithPrescription = () => {
    appointmentActions.handleCompleteWithPrescription(
      dialogState.selectedAppointment,
      prescriptionForm.diagnosis,
      prescriptionForm.prescriptionNotes,
      prescriptionForm.followUpDate,
      prescriptionForm.medications,
      prescriptionForm.selectedFile,
      prescriptionForm.setIsUploading,
      prescriptionForm.resetForm,
    );
  };

  const handleReschedule = () => {
    appointmentActions.handleReschedule(
      dialogState.selectedAppointment,
      dialogState.rescheduleDate,
      dialogState.rescheduleTime,
      dialogState.notes,
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6">
      <PageHeader
        isDoctor={isDoctor}
        loadingUser={userLoading}
        isRefreshing={isRefreshing}
        showSelectedOnly={dateSummary.showSelectedOnly}
        summaryDate={dateSummary.summaryDate}
        summaryLabel={dateSummary.summaryLabel}
        selectedBookedCount={dateSummary.selectedBookedCount}
        selectedRemainingCount={dateSummary.selectedRemainingCount}
        selectedCompletedCount={dateSummary.selectedCompletedCount}
        completedSelectedAppointments={dateSummary.completedSelectedAppointments}
        onRefresh={handleRefresh}
        onSummaryDateChange={dateSummary.setSummaryDate}
        onToggleShowSelected={() =>
          dateSummary.setShowSelectedOnly((prev) => !prev)
        }
        onDownloadCompleted={dateSummary.handleDownloadSelectedCompleted}
      >
        {appointmentsLoading || userLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : dateSummary.visibleAppointments.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">
              {dateSummary.showSelectedOnly
                ? "No appointments found for selected date."
                : "No appointments found."}
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {dateSummary.visibleAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                isDoctor={isDoctor}
                actionLoading={appointmentActions.actionLoading}
                onApprove={appointmentActions.handleApprove}
                onDecline={(appointment) => {
                  dialogState.setSelectedAppointment(appointment);
                  dialogState.setDialogType("decline");
                  dialogState.setNotes("");
                }}
                onStartPrescription={(appointment) => {
                  dialogState.setSelectedAppointment(appointment);
                  dialogState.setDialogType("prescription");
                  prescriptionForm.resetForm();
                }}
                onReschedule={(appointment) => {
                  dialogState.setSelectedAppointment(appointment);
                  dialogState.setRescheduleDate(
                    appointment.appointmentDate.split("T")[0],
                  );
                  dialogState.setRescheduleTime(appointment.appointmentTime);
                  dialogState.setDialogType("reschedule");
                }}
                onCancelDoctor={(appointment) => {
                  dialogState.setSelectedAppointment(appointment);
                  dialogState.setDialogType("cancel");
                }}
                onCancelPatient={(appointment) => {
                  dialogState.setSelectedAppointment(appointment);
                  dialogState.setDialogType("patient_cancel");
                  dialogState.setNotes("");
                }}
                onViewDetails={(appointment) => {
                  dialogState.setSelectedAppointment(appointment);
                  dialogState.setDialogType("view_prescription");
                }}
                onRecordPayment={(appointment) => {
                  dialogState.setSelectedAppointment(appointment);
                  dialogState.setCompletedAppointmentId(appointment.id);

                  // If payment exists, prefill amount and payment ID
                  if (appointment.payment) {
                    dialogState.setPaymentAmount(
                      appointment.payment.amount.toString(),
                    );
                    dialogState.setCreatedPaymentId(appointment.payment.id);
                    // Payment exists means invoice was already sent, go to confirm step
                    dialogState.setPaymentStep("confirm");
                  } else {
                    // New payment - start from invoice step
                    dialogState.setPaymentAmount("");
                    dialogState.setPaymentStep("invoice");
                  }

                  dialogState.setDialogType("payment");
                }}
              />
            ))}
          </div>
        )}
      </PageHeader>

      <PrescriptionDialog
        open={dialogState.dialogType === "prescription"}
        onOpenChange={(open) => {
          if (!open) {
            dialogState.closePrescriptionDialog();
            prescriptionForm.resetForm();
          }
        }}
        selectedAppointment={dialogState.selectedAppointment}
        diagnosis={prescriptionForm.diagnosis}
        onDiagnosisChange={prescriptionForm.setDiagnosis}
        followUpSelectedDate={followUpSelectedDate}
        isFollowUpOpen={prescriptionForm.isFollowUpOpen}
        onFollowUpOpenChange={prescriptionForm.setIsFollowUpOpen}
        onFollowUpDateSelect={(date) =>
          prescriptionForm.setFollowUpDate(formatInputDate(date))
        }
        prescriptionNotes={prescriptionForm.prescriptionNotes}
        onPrescriptionNotesChange={prescriptionForm.setPrescriptionNotes}
        medications={prescriptionForm.medications}
        onAddMedication={prescriptionForm.addMedication}
        onRemoveMedication={prescriptionForm.removeMedication}
        onUpdateMedication={prescriptionForm.updateMedication}
        onAddMedicationFromAI={(medication) =>
          prescriptionForm.setMedications([
            ...prescriptionForm.medications,
            medication,
          ])
        }
        selectedFile={prescriptionForm.selectedFile}
        onFileSelect={prescriptionForm.handleFileSelect}
        actionLoading={appointmentActions.actionLoading}
        isUploading={prescriptionForm.isUploading}
        followUpDate={prescriptionForm.followUpDate}
        onCancel={() => {
          dialogState.closePrescriptionDialog();
          prescriptionForm.resetForm();
        }}
        onComplete={handleCompleteWithPrescription}
      />

      <CancelAppointmentDialog
        open={dialogState.dialogType === "cancel"}
        onOpenChange={(open) => {
          if (!open) dialogState.closeNotesDialog();
        }}
        selectedAppointment={dialogState.selectedAppointment}
        notes={dialogState.notes}
        onNotesChange={dialogState.setNotes}
        actionLoading={appointmentActions.actionLoading}
        onKeep={dialogState.closeNotesDialog}
        onConfirm={(appointmentId, reason) =>
          appointmentActions.handleStatusChange(
            appointmentId,
            "CANCELLED",
            reason,
          )
        }
      />

      <DeclineAppointmentDialog
        open={dialogState.dialogType === "decline"}
        onOpenChange={(open) => {
          if (!open) dialogState.closeNotesDialog();
        }}
        selectedAppointment={dialogState.selectedAppointment}
        notes={dialogState.notes}
        onNotesChange={dialogState.setNotes}
        actionLoading={appointmentActions.actionLoading}
        onBack={dialogState.closeNotesDialog}
        onConfirm={appointmentActions.handleDecline}
      />

      <PatientCancelDialog
        open={dialogState.dialogType === "patient_cancel"}
        onOpenChange={(open) => {
          if (!open) dialogState.closeNotesDialog();
        }}
        selectedAppointment={dialogState.selectedAppointment}
        notes={dialogState.notes}
        onNotesChange={dialogState.setNotes}
        actionLoading={appointmentActions.actionLoading}
        onKeep={dialogState.closeNotesDialog}
        onConfirm={appointmentActions.handlePatientCancel}
      />

      <RescheduleDialog
        open={dialogState.dialogType === "reschedule"}
        onOpenChange={(open) => {
          if (!open) dialogState.closeRescheduleDialog();
        }}
        selectedAppointment={dialogState.selectedAppointment}
        rescheduleDate={dialogState.rescheduleDate}
        rescheduleTime={dialogState.rescheduleTime}
        notes={dialogState.notes}
        onRescheduleDateChange={dialogState.setRescheduleDate}
        onRescheduleTimeChange={dialogState.setRescheduleTime}
        onNotesChange={dialogState.setNotes}
        actionLoading={appointmentActions.actionLoading}
        onCancel={dialogState.closeRescheduleDialog}
        onReschedule={handleReschedule}
      />

      <PaymentDialog
        open={dialogState.dialogType === "payment"}
        onOpenChange={(open) => {
          if (!open) dialogState.closePaymentDialog();
        }}
        paymentStep={dialogState.paymentStep}
        paymentAmount={dialogState.paymentAmount}
        onPaymentAmountChange={dialogState.setPaymentAmount}
        doctorProfile={doctorProfile}
        userData={userData}
        copiedUPI={dialogState.copiedUPI}
        onCopyUPI={dialogState.copyToClipboard}
        sendingInvoice={dialogState.sendingInvoice}
        onSendInvoice={paymentFlow.handleSendInvoice}
        onConfirmPayment={paymentFlow.handlePaymentConfirm}
        patientName={completedPatientName}
      />

      <ViewPrescriptionDialog
        open={dialogState.dialogType === "view_prescription"}
        onOpenChange={(open) => {
          if (!open) dialogState.closeViewPrescriptionDialog();
        }}
        selectedAppointment={dialogState.selectedAppointment}
        onClose={dialogState.closeViewPrescriptionDialog}
      />
    </div>
  );
}
