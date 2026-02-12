"use client";

import { CancelAppointmentDialog } from "@/components/appointments/dialogs/CancelAppointmentDialog";
import { DeclineAppointmentDialog } from "@/components/appointments/dialogs/DeclineAppointmentDialog";
import { PatientCancelDialog } from "@/components/appointments/dialogs/PatientCancelDialog";
import { PaymentDialog } from "@/components/appointments/dialogs/PaymentDialog";
import { PrescriptionDialog } from "@/components/appointments/dialogs/PrescriptionDialog";
import { RescheduleDialog } from "@/components/appointments/dialogs/RescheduleDialog";
import { ViewPrescriptionDialog } from "@/components/appointments/dialogs/ViewPrescriptionDialog";
import { ApproveVideoConsultationDialog } from "@/components/appointments/dialogs/ApproveVideoConsultationDialog";
import { AppointmentCard } from "@/components/appointments/AppointmentCard";
import {
  formatInputDate,
  parseLocalDate,
} from "@/components/appointments/utils";
import { useVideoConsultationsData } from "@/hooks/video-consultations/useVideoConsultationsData";
import { useVideoConsultationCategories } from "@/hooks/video-consultations/useVideoConsultationCategories";
import { useUserData } from "@/hooks/appointments/useUserData";
import { usePrescriptionForm } from "@/hooks/appointments/usePrescriptionForm";
import { useDialogState } from "@/hooks/appointments/useDialogState";
import { useAppointmentActions } from "@/hooks/appointments/useAppointmentActions";
import { usePaymentFlow } from "@/hooks/appointments/usePaymentFlow";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Video } from "lucide-react";
import { useState } from "react";

export default function VideoConsultationsPage() {
  // Data hooks
  const {
    appointments,
    loading: appointmentsLoading,
    refetch,
  } = useVideoConsultationsData();

  const {
    userData,
    doctorProfile,
    loading: userLoading,
    isDoctor,
  } = useUserData();

  // Categorize appointments
  const { scheduled, upcoming, past } =
    useVideoConsultationCategories(appointments);

  // Form state hooks
  const prescriptionForm = usePrescriptionForm();
  const dialogState = useDialogState();

  // Loading state for refresh
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Action handlers
  const appointmentActions = useAppointmentActions({
    setAppointments: (updater) => {
      void updater;
      // Re-fetch appointments after any action
      refetch();
    },
    fetchAppointments: refetch,
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
    fetchAppointments: refetch,
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  // Determine default tab
  const defaultTab =
    upcoming.length > 0
      ? "upcoming"
      : scheduled.length > 0
        ? "scheduled"
        : "past";

  // Render appointment cards
  const renderAppointments = (appointmentsList: typeof appointments) => {
    if (appointmentsList.length === 0) {
      return (
        <div className="rounded-xl border border-dashed bg-muted/20 py-10 text-center">
          <p className="text-muted-foreground">No video consultations found</p>
        </div>
      );
    }

    return (
      <div className="space-y-4 sm:space-y-5">
        {appointmentsList.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            isDoctor={isDoctor}
            actionLoading={appointmentActions.actionLoading}
            onApprove={appointmentActions.handleApprove}
            onApproveVideo={appointmentActions.handleApproveVideo}
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
                String(appointment.appointmentDate).split("T")[0],
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
    );
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5 sm:space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Video className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold sm:text-3xl">
              {isDoctor ? "Video Consultations" : "My Video Consultations"}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Track scheduled, live, and past consultation sessions in one place.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Loading State */}
      {appointmentsLoading || userLoading ? (
        <div className="flex items-center justify-center py-10">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Video className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">
            No video consultations yet
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {isDoctor
              ? "Video consultations will appear here when patients book them"
              : "Book a video consultation to get started"}
          </p>
        </div>
      ) : (
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-3 rounded-xl border bg-linear-to-br from-slate-100 to-slate-50 p-1.5 shadow-sm">
            <TabsTrigger
              value="scheduled"
              className="gap-2 rounded-lg py-2.5 font-medium transition-all data-[state=inactive]:text-muted-foreground data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md"
            >
              Scheduled
              <Badge variant="secondary" className="rounded-full">
                {scheduled.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="upcoming"
              className="gap-2 rounded-lg py-2.5 font-medium transition-all data-[state=inactive]:text-muted-foreground data-[state=active]:bg-linear-to-br data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md [&[data-state=active]>span]:bg-white/20 [&[data-state=active]>span]:text-white"
            >
              Upcoming
              <Badge
                variant="secondary"
                className="rounded-full bg-green-100 text-green-700"
              >
                {upcoming.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="past"
              className="gap-2 rounded-lg py-2.5 font-medium transition-all data-[state=inactive]:text-muted-foreground data-[state=active]:bg-white data-[state=active]:text-slate-700 data-[state=active]:shadow-md"
            >
              Past
              <Badge variant="secondary" className="rounded-full">
                {past.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scheduled" className="mt-6">
            {renderAppointments(scheduled)}
          </TabsContent>

          <TabsContent value="upcoming" className="mt-6">
            {renderAppointments(upcoming)}
          </TabsContent>

          <TabsContent value="past" className="mt-6">
            {renderAppointments(past)}
          </TabsContent>
        </Tabs>
      )}

      {/* Dialogs */}
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
          if (!open) {
            dialogState.closeRescheduleDialog();
          }
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
          if (!open) {
            dialogState.closePaymentDialog();
          }
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
          if (!open) {
            dialogState.closeViewPrescriptionDialog();
          }
        }}
        selectedAppointment={dialogState.selectedAppointment}
        onClose={dialogState.closeViewPrescriptionDialog}
      />

      <ApproveVideoConsultationDialog
        open={dialogState.dialogType === "approve_video"}
        onOpenChange={(open) => {
          if (!open) {
            dialogState.closeApproveVideoDialog();
          }
        }}
        selectedAppointment={dialogState.selectedAppointment}
        feeAmount={dialogState.videoConsultationFee}
        onFeeAmountChange={dialogState.setVideoConsultationFee}
        actionLoading={appointmentActions.actionLoading}
        onCancel={dialogState.closeApproveVideoDialog}
        onConfirm={appointmentActions.handleConfirmVideoApproval}
      />
    </div>
  );
}
