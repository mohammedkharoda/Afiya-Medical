import { useState } from "react";
import { Appointment } from "@/components/appointments/types";

export type DialogType =
  | "prescription"
  | "cancel"
  | "decline"
  | "patient_cancel"
  | "reschedule"
  | "payment"
  | "approve_video"
  | "view_prescription"
  | null;

export function useDialogState() {
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [notes, setNotes] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  // Payment related state
  const [paymentAmount, setPaymentAmount] = useState("Enter the fee");
  const [copiedUPI, setCopiedUPI] = useState(false);
  const [completedAppointmentId, setCompletedAppointmentId] = useState<
    string | null
  >(null);
  const [paymentStep, setPaymentStep] = useState<"invoice" | "confirm">(
    "invoice",
  );
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [createdPaymentId, setCreatedPaymentId] = useState<string | null>(null);
  const [videoConsultationFee, setVideoConsultationFee] = useState("");

  const closePrescriptionDialog = () => {
    setDialogType(null);
    setSelectedAppointment(null);
  };

  const closeNotesDialog = () => {
    setDialogType(null);
    setSelectedAppointment(null);
    setNotes("");
  };

  const closeRescheduleDialog = () => {
    setDialogType(null);
    setSelectedAppointment(null);
    setNotes("");
    setRescheduleDate("");
    setRescheduleTime("");
  };

  const closePaymentDialog = () => {
    setDialogType(null);
    setCompletedAppointmentId(null);
    setPaymentAmount("Enter the fee");
    setCopiedUPI(false);
    setPaymentStep("invoice");
    setCreatedPaymentId(null);
  };

  const closeViewPrescriptionDialog = () => {
    setDialogType(null);
    setSelectedAppointment(null);
  };

  const closeApproveVideoDialog = () => {
    setDialogType(null);
    setSelectedAppointment(null);
    setVideoConsultationFee("");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUPI(true);
    setTimeout(() => setCopiedUPI(false), 2000);
  };

  return {
    selectedAppointment,
    setSelectedAppointment,
    dialogType,
    setDialogType,
    notes,
    setNotes,
    rescheduleDate,
    setRescheduleDate,
    rescheduleTime,
    setRescheduleTime,
    paymentAmount,
    setPaymentAmount,
    copiedUPI,
    setCopiedUPI,
    completedAppointmentId,
    setCompletedAppointmentId,
    paymentStep,
    setPaymentStep,
    sendingInvoice,
    setSendingInvoice,
    createdPaymentId,
    setCreatedPaymentId,
    videoConsultationFee,
    setVideoConsultationFee,
    closePrescriptionDialog,
    closeNotesDialog,
    closeRescheduleDialog,
    closePaymentDialog,
    closeViewPrescriptionDialog,
    closeApproveVideoDialog,
    copyToClipboard,
  };
}
