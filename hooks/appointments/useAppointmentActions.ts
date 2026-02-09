import { useState, Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import { Appointment, Medication } from "@/components/appointments/types";

interface UseAppointmentActionsProps {
  setAppointments: Dispatch<SetStateAction<Appointment[]>>;
  fetchAppointments: () => Promise<void>;
  setDialogType: (type: any) => void;
  setSelectedAppointment: (appointment: Appointment | null) => void;
  setNotes: (notes: string) => void;
  setCompletedAppointmentId: (id: string | null) => void;
}

export function useAppointmentActions({
  setAppointments,
  fetchAppointments,
  setDialogType,
  setSelectedAppointment,
  setNotes,
  setCompletedAppointmentId,
}: UseAppointmentActionsProps) {
  const [actionLoading, setActionLoading] = useState<{
    id: string;
    action: string;
  } | null>(null);

  const handleApprove = async (appointmentId: string) => {
    setActionLoading({ id: appointmentId, action: "approve" });
    try {
      const response = await fetch(
        `/api/appointments/${appointmentId}/approve`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      if (response.ok) {
        setAppointments((prev) =>
          prev.map((a) =>
            a.id === appointmentId ? { ...a, status: "SCHEDULED" } : a,
          ),
        );
        toast.success("Appointment approved!");
        await fetchAppointments();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to approve appointment");
      }
    } catch {
      toast.error("Failed to approve appointment");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (appointmentId: string, reason: string) => {
    if (!reason.trim() || reason.trim().length < 10) {
      toast.error("Please provide a reason (at least 10 characters)");
      return;
    }

    setActionLoading({ id: appointmentId, action: "decline" });
    try {
      const response = await fetch(
        `/api/appointments/${appointmentId}/decline`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ reason: reason.trim() }),
        },
      );

      if (response.ok) {
        setAppointments((prev) =>
          prev.map((a) =>
            a.id === appointmentId ? { ...a, status: "DECLINED" } : a,
          ),
        );
        toast.success("Appointment declined");
        setDialogType(null);
        setSelectedAppointment(null);
        setNotes("");
        await fetchAppointments();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to decline appointment");
      }
    } catch {
      toast.error("Failed to decline appointment");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePatientCancel = async (appointmentId: string, reason: string) => {
    if (!reason.trim() || reason.trim().length < 10) {
      toast.error("Please provide a reason (at least 10 characters)");
      return;
    }

    setActionLoading({ id: appointmentId, action: "patient_cancel" });
    try {
      const response = await fetch(
        `/api/appointments/${appointmentId}/cancel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ reason: reason.trim() }),
        },
      );

      if (response.ok) {
        setAppointments((prev) =>
          prev.map((a) =>
            a.id === appointmentId ? { ...a, status: "CANCELLED" } : a,
          ),
        );
        toast.success("Appointment cancelled");
        setDialogType(null);
        setSelectedAppointment(null);
        setNotes("");
        await fetchAppointments();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to cancel appointment");
      }
    } catch {
      toast.error("Failed to cancel appointment");
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (
    appointmentId: string,
    status: string,
    appointmentNotes?: string,
  ) => {
    setActionLoading({ id: appointmentId, action: status.toLowerCase() });
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, notes: appointmentNotes }),
      });

      if (response.ok) {
        const data = await response.json();
        setAppointments((prev) =>
          prev.map((a) =>
            a.id === appointmentId ? { ...a, ...data.appointment } : a,
          ),
        );

        // If completing an appointment, show payment dialog
        if (status === "COMPLETED") {
          setCompletedAppointmentId(appointmentId);
          setDialogType("payment");
          setSelectedAppointment(null);
          setNotes("");
          toast.success("Appointment completed! Please confirm payment.");
        } else {
          toast.success(`Appointment ${status.toLowerCase()} successfully`);
          setDialogType(null);
          setSelectedAppointment(null);
          setNotes("");
        }
      } else {
        toast.error("Failed to update appointment");
      }
    } catch {
      toast.error("Failed to update appointment");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReschedule = async (
    selectedAppointment: Appointment | null,
    rescheduleDate: string,
    rescheduleTime: string,
    notes: string,
  ) => {
    if (!selectedAppointment || !rescheduleDate || !rescheduleTime) {
      toast.error("Please select a new date and time");
      return;
    }

    setActionLoading({ id: selectedAppointment.id, action: "reschedule" });
    try {
      const response = await fetch(
        `/api/appointments/${selectedAppointment.id}/reschedule`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            newDate: rescheduleDate,
            newTime: rescheduleTime,
            reason: notes || undefined,
          }),
        },
      );

      if (response.ok) {
        setAppointments((prev) =>
          prev.map((a) =>
            a.id === selectedAppointment.id
              ? {
                  ...a,
                  appointmentDate: rescheduleDate,
                  appointmentTime: rescheduleTime,
                  status: "RESCHEDULED",
                }
              : a,
          ),
        );
        toast.success("Appointment rescheduled successfully");
        setDialogType(null);
        setSelectedAppointment(null);
        setNotes("");
        await fetchAppointments();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to reschedule appointment");
      }
    } catch {
      toast.error("Failed to reschedule appointment");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteWithPrescription = async (
    selectedAppointment: Appointment | null,
    diagnosis: string,
    prescriptionNotes: string,
    followUpDate: string,
    medications: Medication[],
    selectedFile: File | null,
    setIsUploading: (value: boolean) => void,
    resetPrescriptionForm: () => void,
  ) => {
    if (!selectedAppointment) return;
    if (!diagnosis) {
      toast.error("Diagnosis is required");
      return;
    }

    setActionLoading({ id: selectedAppointment.id, action: "complete" });
    setIsUploading(true);
    try {
      let attachmentUrl = "";
      let attachmentPublicId = "";

      // Upload file if exists (to Cloudinary)
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadRes = await fetch("/api/upload/prescription", {
          method: "POST",
          body: formData,
        });

        if (uploadRes.ok) {
          const data = await uploadRes.json();
          attachmentUrl = data.url;
          attachmentPublicId = data.publicId;
        } else {
          toast.error("Failed to upload file");
          setActionLoading(null);
          setIsUploading(false);
          return;
        }
      }

      // Create prescription and complete appointment
      const response = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          appointmentId: selectedAppointment.id,
          diagnosis,
          notes: prescriptionNotes,
          followUpDate,
          medications,
          attachmentUrl,
          attachmentPublicId,
        }),
      });

      if (response.ok) {
        setAppointments((prev) =>
          prev.map((a) =>
            a.id === selectedAppointment.id ? { ...a, status: "COMPLETED" } : a,
          ),
        );

        toast.success("Prescription saved and appointment completed!");

        // Open payment dialog
        setCompletedAppointmentId(selectedAppointment.id);
        setDialogType("payment");
        setSelectedAppointment(null);

        // Reset form
        resetPrescriptionForm();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to complete appointment");
      }
    } catch (error) {
      console.error("Error completing appointment:", error);
      toast.error("An error occurred");
    } finally {
      setActionLoading(null);
      setIsUploading(false);
    }
  };

  return {
    actionLoading,
    handleApprove,
    handleDecline,
    handlePatientCancel,
    handleStatusChange,
    handleReschedule,
    handleCompleteWithPrescription,
  };
}
