import { toast } from "sonner";

interface UsePaymentFlowProps {
  completedAppointmentId: string | null;
  paymentAmount: string;
  createdPaymentId: string | null;
  setSendingInvoice: (value: boolean) => void;
  setCreatedPaymentId: (id: string | null) => void;
  setPaymentStep: (step: "invoice" | "confirm") => void;
  setDialogType: (type: any) => void;
  setCompletedAppointmentId: (id: string | null) => void;
  setPaymentAmount: (amount: string) => void;
  setCopiedUPI: (value: boolean) => void;
  fetchAppointments: () => Promise<void>;
}

export function usePaymentFlow({
  completedAppointmentId,
  paymentAmount,
  createdPaymentId,
  setSendingInvoice,
  setCreatedPaymentId,
  setPaymentStep,
  setDialogType,
  setCompletedAppointmentId,
  setPaymentAmount,
  setCopiedUPI,
  fetchAppointments,
}: UsePaymentFlowProps) {
  // Step 1: Send invoice email to patient, create pending payment
  const handleSendInvoice = async () => {
    if (!completedAppointmentId) return;
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid consultation fee");
      return;
    }

    setSendingInvoice(true);
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          appointmentId: completedAppointmentId,
          amount,
          paymentMethod: "CASH",
          notes: "Invoice sent to patient",
          isPaid: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCreatedPaymentId(data.payment?.id || null);
        toast.success("Invoice sent to patient's email!");

        // Refresh appointments to sync payment data
        await fetchAppointments();

        setPaymentStep("confirm");
      } else {
        const errorData = await response.json();
        // Check if invoice already exists for this appointment
        if (errorData.error?.includes("already exists") || errorData.error?.includes("already sent")) {
          toast.error("Invoice already sent for this appointment");
          // Refresh data and go to confirm step
          await fetchAppointments();
          setPaymentStep("confirm");
        } else {
          toast.error(errorData.error || "Failed to send invoice");
        }
      }
    } catch {
      toast.error("Failed to send invoice");
    } finally {
      setSendingInvoice(false);
    }
  };

  // Step 2: Confirm if patient has paid
  const handlePaymentConfirm = async (paymentReceived: boolean) => {
    if (!completedAppointmentId) return;

    if (paymentReceived && createdPaymentId) {
      try {
        // Mark the existing payment as paid
        const response = await fetch("/api/payments", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            paymentId: createdPaymentId,
            status: "PAID",
          }),
        });

        if (response.ok) {
          toast.success("Payment recorded successfully!");
          await fetchAppointments();
        } else {
          toast.error("Failed to record payment");
        }
      } catch {
        toast.error("Failed to record payment");
      }
    } else {
      toast.success("Payment marked as pending");
      await fetchAppointments();
    }

    // Close payment dialog and reset
    setDialogType(null);
    setCompletedAppointmentId(null);
    setPaymentAmount("Enter the fee");
    setCopiedUPI(false);
    setPaymentStep("invoice");
    setCreatedPaymentId(null);
  };

  return {
    handleSendInvoice,
    handlePaymentConfirm,
  };
}
