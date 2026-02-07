"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  ChevronRight,
  User,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  Phone,
  CalendarDays,
  Banknote,
  Copy,
  Check,
  Plus,
  Trash,
  FileIcon,
  Pill,
  Eye,
  TrendingUp,
  RefreshCw,
  Send,
  Download,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as DatePicker } from "@/components/ui/calendar";
import { toast } from "sonner";
import { usePusherAppointments } from "@/hooks/use-pusher-notifications";
import { AIMedicationSuggestions } from "@/components/ai-medication-suggestions";

interface Appointment {
  id: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  symptoms?: string;
  notes?: string;
  originalAppointmentDate?: string;
  originalAppointmentTime?: string;
  rescheduledAt?: string;
  patient?: {
    id?: string;
    address?: string;
    user?: {
      name?: string;
      email?: string;
      phone?: string;
    };
    medicalDocuments?: {
      id: string;
      fileUrl: string;
      fileName: string;
      documentType: string;
      createdAt: string;
    }[];
  };
  prescription?: {
    diagnosis: string;
    notes?: string;
    followUpDate?: string | null;
    medications: {
      medicineName: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string;
    }[];
  };
  payment?: {
    amount: number;
    status: string;
    paidAt?: string;
  };
}

type UserRole = "PATIENT" | "DOCTOR" | "ADMIN";

interface UserData {
  id: string;
  email: string;
  name: string;
  role?: UserRole;
}

interface DoctorProfile {
  speciality: string;
  degrees: string[];
  experience: number | null;
  upiId: string;
  clinicAddress: string | null;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(
    null,
  );
  const [loadingUser, setLoadingUser] = useState(true);
  const [actionLoading, setActionLoading] = useState<{
    id: string;
    action: string;
  } | null>(null);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [dialogType, setDialogType] = useState<
    | "prescription"
    | "cancel"
    | "decline"
    | "patient_cancel"
    | "reschedule"
    | "payment"
    | "view_prescription"
    | null
  >(null);
  const [notes, setNotes] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
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

  // Prescription Form State
  const [diagnosis, setDiagnosis] = useState("");
  const [prescriptionNotes, setPrescriptionNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [medications, setMedications] = useState<
    {
      medicineName: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions: string;
    }[]
  >([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [summaryDate, setSummaryDate] = useState<Date>(new Date());

  const isDoctor = userData?.role === "DOCTOR";

  // Manual refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAppointments();
    setIsRefreshing(false);
  };

  const fetchAppointments = useCallback(async () => {
    try {
      const response = await fetch("/api/appointments", {
        credentials: "include",
      });
      const data = await response.json();
      console.log("Appointments page - API response:", data);
      console.log(
        "Appointments page - Appointments count:",
        data.appointments?.length,
      );
      if (response.ok) {
        // Sort appointments: PENDING first (for doctors), then by date (recent first)
        const sortedAppointments = [...(data.appointments || [])].sort(
          (a, b) => {
            // Status priority: PENDING > SCHEDULED > RESCHEDULED > COMPLETED > CANCELLED > DECLINED
            const statusOrder: Record<string, number> = {
              PENDING: 0,
              SCHEDULED: 1,
              RESCHEDULED: 2,
              COMPLETED: 3,
              CANCELLED: 4,
              DECLINED: 5,
            };
            const statusDiff =
              (statusOrder[a.status] ?? 6) - (statusOrder[b.status] ?? 6);
            if (statusDiff !== 0) return statusDiff;

            // Within same status, sort by date (most recent first)
            return (
              new Date(b.appointmentDate).getTime() -
              new Date(a.appointmentDate).getTime()
            );
          },
        );
        setAppointments(sortedAppointments);
      }
    } catch (error) {
      console.error("Appointments page - Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Real-time appointment updates via Pusher
  usePusherAppointments(
    useCallback(() => {
      // For any appointment change, refetch to get complete data
      // This handles: new appointments (for doctor), status changes, rescheduling
      fetchAppointments();
    }, [fetchAppointments]),
  );

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/user/me", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setUserData(data.user);
          // Set doctor profile if available (for doctors)
          if (data.doctorProfile) {
            setDoctorProfile(data.doctorProfile);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserData();
  }, []);

  // Fetch appointments on mount
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Medication Helpers
  const addMedication = () => {
    setMedications([
      ...medications,
      {
        medicineName: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
      },
    ]);
  };

  const removeMedication = (index: number) => {
    const newMeds = [...medications];
    newMeds.splice(index, 1);
    setMedications(newMeds);
  };

  const updateMedication = (index: number, field: string, value: string) => {
    const newMeds = [...medications];
    // @ts-expect-error - dynamic field access
    newMeds[index][field] = value;
    setMedications(newMeds);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleCompleteWithPrescription = async () => {
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
        // Update local state
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
        setDiagnosis("");
        setPrescriptionNotes("");
        setFollowUpDate("");
        setMedications([]);
        setSelectedFile(null);
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
        setPaymentStep("confirm");
      } else {
        toast.error("Failed to send invoice");
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
          fetchAppointments();
        } else {
          toast.error("Failed to record payment");
        }
      } catch {
        toast.error("Failed to record payment");
      }
    } else {
      toast.success("Payment marked as pending");
      fetchAppointments();
    }

    // Close payment dialog and reset
    setDialogType(null);
    setCompletedAppointmentId(null);
    setPaymentAmount("Enter the fee");
    setCopiedUPI(false);
    setPaymentStep("invoice");
    setCreatedPaymentId(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUPI(true);
    setTimeout(() => setCopiedUPI(false), 2000);
  };

  const handleReschedule = async () => {
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
        // Update local state with new date, time, and RESCHEDULED status
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
        setRescheduleDate("");
        setRescheduleTime("");
        // Refetch to get any additional updated data
        fetchAppointments();
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

  // Handle doctor approving a pending appointment
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
        fetchAppointments();
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

  // Handle doctor declining a pending appointment
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
        fetchAppointments();
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

  // Handle patient cancelling their appointment
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
        fetchAppointments();
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      case "SCHEDULED":
        return "bg-green-100 text-green-700";
      case "COMPLETED":
        return "bg-blue-100 text-blue-700";
      case "CANCELLED":
        return "bg-red-100 text-red-700";
      case "DECLINED":
        return "bg-red-100 text-red-700";
      case "RESCHEDULED":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatInputDate = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  const parseLocalDate = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return undefined;
    return new Date(year, month - 1, day);
  };

  const followUpSelectedDate = followUpDate
    ? parseLocalDate(followUpDate)
    : undefined;

  const getLocalDateKey = (value: string | Date) => {
    const date = new Date(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const summaryKey = getLocalDateKey(summaryDate);
  const summaryLabel = summaryDate.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const selectedDateAppointments = appointments.filter(
    (appointment) =>
      getLocalDateKey(appointment.appointmentDate) === summaryKey,
  );
  const selectedBookedCount = selectedDateAppointments.filter(
    (appointment) =>
      appointment.status !== "CANCELLED" && appointment.status !== "DECLINED",
  ).length;
  const selectedRemainingCount = selectedDateAppointments.filter(
    (appointment) =>
      ["PENDING", "SCHEDULED", "RESCHEDULED"].includes(appointment.status),
  ).length;
  const selectedCompletedCount = selectedDateAppointments.filter(
    (appointment) => appointment.status === "COMPLETED",
  ).length;
  const completedSelectedAppointments = selectedDateAppointments.filter(
    (appointment) => appointment.status === "COMPLETED",
  );

  const visibleAppointments = showSelectedOnly
    ? selectedDateAppointments
    : appointments;

  const csvEscape = (value: string) => {
    const stringValue = value ?? "";
    if (
      stringValue.includes(",") ||
      stringValue.includes('"') ||
      stringValue.includes("\n")
    ) {
      return `"${stringValue.replace(/\"/g, '""')}"`;
    }
    return stringValue;
  };

  const handleDownloadSelectedCompleted = () => {
    if (!completedSelectedAppointments.length) {
      toast.info("No completed appointments for this date yet.");
      return;
    }

    const rows = [
      ["Patient Name", "Symptoms", "Address", "Phone", "Medicine Prescribed"],
      ...completedSelectedAppointments.map((appointment) => {
        const patientName = appointment.patient?.user?.name || "";
        const symptoms = appointment.symptoms || "";
        const address = appointment.patient?.address || "";
        const rawPhone = appointment.patient?.user?.phone || "";
        const phone = rawPhone ? `="${rawPhone}"` : "";
        const medications =
          appointment.prescription?.medications
            ?.map((med) =>
              [med.medicineName, med.dosage, med.frequency, med.duration]
                .filter(Boolean)
                .join(" "),
            )
            .join(" | ") || "";

        return [patientName, symptoms, address, phone, medications];
      }),
    ];

    const csvContent = rows
      .map((row) => row.map((value) => csvEscape(value)).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `completed-${summaryKey}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    toast.success("Completed appointments exported.");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6">
      <Card className="border-border">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-6">
          <div>
            <CardTitle className="font-heading text-xl sm:text-2xl">
              {isDoctor ? "Patient Appointments" : "Appointments"}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {isDoctor
                ? "Manage and update patient appointments."
                : "Review your upcoming and past appointments."}
            </CardDescription>
            {isDoctor && showSelectedOnly && (
              <Badge variant="outline" className="mt-2 w-fit">
                Showing selected date only
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh appointments"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </Button>
            {isDoctor && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    title="Date appointment summary"
                  >
                    <CalendarDays className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Date summary</p>
                      <Badge variant="outline" className="text-[11px]">
                        {summaryLabel}
                      </Badge>
                    </div>
                    <DatePicker
                      mode="single"
                      selected={summaryDate}
                      onSelect={(date) => date && setSummaryDate(date)}
                      initialFocus
                    />
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Booked</span>
                        <span className="font-semibold">
                          {selectedBookedCount}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Need to see
                        </span>
                        <span className="font-semibold">
                          {selectedRemainingCount}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Completed</span>
                        <span className="font-semibold">
                          {selectedCompletedCount}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowSelectedOnly((prev) => !prev)}
                      >
                        {showSelectedOnly
                          ? "Show all appointments"
                          : "Show selected date"}
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleDownloadSelectedCompleted}
                        disabled={!completedSelectedAppointments.length}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download Excel (CSV)
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
            {!loadingUser && !isDoctor && (
              <Button
                asChild
                className="bg-black text-white hover:bg-gray-900 flex items-center justify-center flex-1 sm:flex-none text-sm"
                size="sm"
              >
                <Link href="/appointments/new">
                  Book Appointment
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {loading || loadingUser ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : visibleAppointments.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                {showSelectedOnly
                  ? "No appointments found for selected date."
                  : "No appointments found."}
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {visibleAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-lg border border-border p-3 sm:p-4 space-y-3"
                >
                  {/* Header Row */}
                  <div className="flex items-start sm:items-center justify-between gap-2">
                    <div className="flex items-start sm:items-center gap-2 sm:gap-3 min-w-0">
                      <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm sm:text-base text-foreground">
                          {formatDate(appointment.appointmentDate)}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          <Clock className="mr-1 inline h-3 w-3 sm:h-4 sm:w-4" />
                          {appointment.appointmentTime}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={`${getStatusColor(appointment.status)} text-xs shrink-0`}
                    >
                      {appointment.status}
                    </Badge>
                  </div>

                  {/* Doctor View: Patient Info */}
                  {isDoctor && appointment.patient?.user && (
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
                          <Phone
                            size={12}
                            className="shrink-0 sm:w-3.5 sm:h-3.5"
                          />
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
                  )}

                  {/* Doctor View: Rescheduled indicator */}
                  {isDoctor &&
                    appointment.status === "RESCHEDULED" &&
                    appointment.originalAppointmentDate && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                        <p className="text-xs text-amber-700">
                          <CalendarDays className="inline h-3 w-3 mr-1" />
                          Originally:{" "}
                          {formatDate(appointment.originalAppointmentDate)}
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

                  {/* Doctor Actions - PENDING appointments: Approve/Decline */}
                  {isDoctor && appointment.status === "PENDING" && (
                    <div className="flex items-center gap-1.5 sm:gap-2 pt-2 border-t flex-wrap">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(appointment.id)}
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
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setDialogType("decline");
                          setNotes("");
                        }}
                        className="bg-red-500 hover:bg-red-600 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                        disabled={actionLoading?.id === appointment.id}
                      >
                        <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  )}

                  {/* Doctor Actions - SCHEDULED/RESCHEDULED: Complete/Reschedule/Cancel */}
                  {isDoctor &&
                    (appointment.status === "SCHEDULED" ||
                      appointment.status === "RESCHEDULED") && (
                      <div className="flex items-center gap-1.5 sm:gap-2 pt-2 border-t flex-wrap">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setDialogType("prescription");
                            // Reset form
                            setDiagnosis("");
                            setPrescriptionNotes("");
                            setFollowUpDate("");
                            setMedications([]);
                            setSelectedFile(null);
                          }}
                          className="bg-green-500 hover:bg-green-600 text-white text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                          disabled={actionLoading?.id === appointment.id}
                        >
                          {actionLoading?.id === appointment.id ? (
                            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1" />
                          ) : (
                            <Pill className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          )}
                          <span className="hidden xs:inline">
                            Start Prescription
                          </span>
                          <span className="xs:hidden">Prescription</span>
                        </Button>
                        {/* Only show Reschedule button for SCHEDULED status - not for already rescheduled */}
                        {appointment.status === "SCHEDULED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-amber-500 text-amber-600 hover:bg-amber-50 hover:text-amber-700 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setRescheduleDate(
                                appointment.appointmentDate.split("T")[0],
                              );
                              setRescheduleTime(appointment.appointmentTime);
                              setDialogType("reschedule");
                            }}
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
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setDialogType("cancel");
                          }}
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
                    )}

                  {/* Patient: Pending Approval Info */}
                  {!isDoctor && appointment.status === "PENDING" && (
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
                        Your appointment request is pending. The doctor will
                        review it and update you once approved. After 10 minutes
                        please refresh and check again, and keep an eye on your
                        email for confirmation.
                      </p>
                    </div>
                  )}

                  {/* Patient: Declined Appointment Info */}
                  {!isDoctor && appointment.status === "DECLINED" && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3 space-y-1.5 sm:space-y-2">
                      <div className="flex items-center gap-2 text-red-700">
                        <XCircle size={14} className="shrink-0" />
                        <span className="font-medium text-xs sm:text-sm">
                          Appointment Declined
                        </span>
                      </div>
                      <p className="text-xs text-red-600">
                        Your appointment request was declined by the doctor.
                        Please try booking a different time slot.
                      </p>
                    </div>
                  )}

                  {/* Patient: Rescheduled Appointment Info */}
                  {!isDoctor && appointment.status === "RESCHEDULED" && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 sm:p-3 space-y-1.5 sm:space-y-2">
                      <div className="flex items-start sm:items-center gap-2 text-amber-700">
                        <CalendarDays
                          size={14}
                          className="shrink-0 mt-0.5 sm:mt-0"
                        />
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

                  {/* Patient: Symptoms display for non-doctor view */}
                  {!isDoctor && appointment.symptoms && (
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

                  {/* Patient Actions - Cancel for SCHEDULED appointments */}
                  {!isDoctor && appointment.status === "SCHEDULED" && (
                    <div className="flex items-center gap-2 pt-2 border-t mt-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="bg-red-500 hover:bg-red-600 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setDialogType("patient_cancel");
                          setNotes("");
                        }}
                        disabled={actionLoading?.id === appointment.id}
                      >
                        {actionLoading?.id === appointment.id ? (
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        )}
                        Cancel Appointment
                      </Button>
                    </div>
                  )}

                  {/* Patient Actions - View Details for COMPLETED */}
                  {!isDoctor && appointment.status === "COMPLETED" && (
                    <div className="flex items-center gap-2 pt-2 border-t mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setDialogType("view_prescription");
                        }}
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="hidden sm:inline">
                          View Details & Prescription
                        </span>
                        <span className="sm:hidden">View Details</span>
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prescription & Complete Dialog */}
      <Dialog
        open={dialogType === "prescription"}
        onOpenChange={() => {
          setDialogType(null);
          setSelectedAppointment(null);
          setIsFollowUpOpen(false);
        }}
      >
        <DialogContent
          style={{ backgroundColor: "white" }}
          className="max-w-3xl max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>Write Prescription</DialogTitle>
            <DialogDescription>
              Enter diagnosis, medications and notes. Click &quot;Done&quot;
              when finished to complete the appointment and record payment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Diagnosis & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Diagnosis <span className="text-red-500">*</span>
                </label>
                <Input
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g., Viral Fever"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Follow-up Date <span className="text-red-500">*</span>
                </label>
                <Popover
                  open={isFollowUpOpen}
                  onOpenChange={setIsFollowUpOpen}
                  modal={true}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {followUpSelectedDate ? (
                        followUpSelectedDate.toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      ) : (
                        <span className="text-muted-foreground">
                          Pick a date
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="w-auto p-0 z-10002"
                    sideOffset={6}
                  >
                    <DatePicker
                      mode="single"
                      selected={followUpSelectedDate}
                      onSelect={(date) =>
                        date && setFollowUpDate(formatInputDate(date))
                      }
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Clinical Notes <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={prescriptionNotes}
                onChange={(e) => setPrescriptionNotes(e.target.value)}
                placeholder="Detailed clinical notes..."
                rows={3}
              />
            </div>

            <div className="border-t pt-4"></div>

            {/* Medications */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <Pill className="h-4 w-4" /> Medications{" "}
                  <span className="text-red-500">*</span>
                </h4>
                <Button variant="outline" size="sm" onClick={addMedication}>
                  <Plus className="h-3 w-3 mr-1" /> Add Medicine
                </Button>
              </div>

              {medications.length === 0 ? (
                <div className="text-center py-4 bg-red-50 rounded-lg text-sm text-red-600 border border-dashed border-red-300">
                  At least one medication is required. Click &quot;Add
                  Medicine&quot; to prescribe.
                </div>
              ) : (
                <div className="space-y-4">
                  {medications.map((med, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">
                          Medicine #{index + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                          onClick={() => removeMedication(index)}
                        >
                          <Trash className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">
                            Medicine Name *
                          </label>
                          <Input
                            placeholder="e.g., Paracetamol, Amoxicillin"
                            value={med.medicineName}
                            onChange={(e) =>
                              updateMedication(
                                index,
                                "medicineName",
                                e.target.value,
                              )
                            }
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">
                            Dosage *
                          </label>
                          <Input
                            placeholder="e.g., 500mg, 10ml"
                            value={med.dosage}
                            onChange={(e) =>
                              updateMedication(index, "dosage", e.target.value)
                            }
                            className="h-10"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">
                            Frequency *
                          </label>
                          <Input
                            placeholder="e.g., Once daily, Twice daily, Every 8 hours"
                            value={med.frequency}
                            onChange={(e) =>
                              updateMedication(
                                index,
                                "frequency",
                                e.target.value,
                              )
                            }
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">
                            Duration *
                          </label>
                          <Input
                            placeholder="e.g., 5 days, 2 weeks, 1 month"
                            value={med.duration}
                            onChange={(e) =>
                              updateMedication(
                                index,
                                "duration",
                                e.target.value,
                              )
                            }
                            className="h-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          Special Instructions (Optional)
                        </label>
                        <Input
                          placeholder="e.g., Take after meals, Avoid dairy products, Take with warm water"
                          value={med.instructions}
                          onChange={(e) =>
                            updateMedication(
                              index,
                              "instructions",
                              e.target.value,
                            )
                          }
                          className="h-10"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Medication Suggestions - Doctor Only */}
            {selectedAppointment && (
              <AIMedicationSuggestions
                appointmentId={selectedAppointment.id}
                diagnosis={diagnosis}
                existingMedications={medications}
                onAddMedication={(medication) => {
                  setMedications([...medications, medication]);
                }}
              />
            )}

            <div className="border-t pt-4"></div>

            {/* Attachments */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <FileIcon className="h-4 w-4" /> Attachments (X-Ray, Report,
                etc.)
              </h4>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  onChange={handleFileSelect}
                  className="max-w-xs"
                />
                {selectedFile && (
                  <span className="text-sm text-green-600 flex items-center">
                    <Check className="h-3 w-3 mr-1" /> {selectedFile.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            {/* Validation message */}
            {(!diagnosis.trim() ||
              !prescriptionNotes.trim() ||
              !followUpDate ||
              medications.length === 0 ||
              medications.some(
                (med) =>
                  !med.medicineName.trim() ||
                  !med.dosage.trim() ||
                  !med.frequency.trim() ||
                  !med.duration.trim(),
              )) && (
              <p className="text-xs text-red-500 mr-auto">
                Please fill all required fields (*) to enable Done button
              </p>
            )}
            <div className="flex gap-2 ml-auto">
              <Button
                variant="outline"
                onClick={() => {
                  setDialogType(null);
                  setSelectedAppointment(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCompleteWithPrescription}
                disabled={
                  actionLoading?.id === selectedAppointment?.id ||
                  isUploading ||
                  !diagnosis.trim() ||
                  !prescriptionNotes.trim() ||
                  !followUpDate ||
                  medications.length === 0 ||
                  medications.some(
                    (med) =>
                      !med.medicineName.trim() ||
                      !med.dosage.trim() ||
                      !med.frequency.trim() ||
                      !med.duration.trim(),
                  )
                }
                className="bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {actionLoading?.id === selectedAppointment?.id ||
                isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-1" />
                )}
                Done
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Appointment Dialog */}
      <Dialog
        open={dialogType === "cancel"}
        onOpenChange={() => {
          setDialogType(null);
          setSelectedAppointment(null);
          setNotes("");
        }}
      >
        <DialogContent style={{ backgroundColor: "white" }}>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this appointment? The patient will
              be notified.{" "}
              <strong>You must provide a reason for cancellation.</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Reason for cancellation <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Please provide a reason for cancellation..."
                value={notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setNotes(e.target.value)
                }
                rows={3}
                className={!notes.trim() ? "border-red-300" : ""}
              />
              {!notes.trim() && (
                <p className="text-xs text-red-500">
                  Reason is required to cancel the appointment
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                setDialogType(null);
                setSelectedAppointment(null);
                setNotes("");
              }}
            >
              Keep Appointment
            </Button>
            <Button
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={() =>
                selectedAppointment &&
                notes.trim() &&
                handleStatusChange(selectedAppointment.id, "CANCELLED", notes)
              }
              disabled={
                actionLoading?.id === selectedAppointment?.id || !notes.trim()
              }
            >
              {actionLoading?.id === selectedAppointment?.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <XCircle className="h-4 w-4 mr-1" />
              )}
              Cancel Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decline Appointment Dialog (Doctor) */}
      <Dialog
        open={dialogType === "decline"}
        onOpenChange={() => {
          setDialogType(null);
          setSelectedAppointment(null);
          setNotes("");
        }}
      >
        <DialogContent style={{ backgroundColor: "white" }}>
          <DialogHeader>
            <DialogTitle>Decline Appointment Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to decline this appointment request? The
              patient will be notified.{" "}
              <strong>Please provide a reason for declining.</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Reason for declining <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="e.g., Schedule conflict, please try a different time slot..."
                value={notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setNotes(e.target.value)
                }
                rows={3}
                className={notes.trim().length < 10 ? "border-red-300" : ""}
              />
              {notes.trim().length < 10 && (
                <p className="text-xs text-red-500">
                  Reason must be at least 10 characters
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                setDialogType(null);
                setSelectedAppointment(null);
                setNotes("");
              }}
            >
              Go Back
            </Button>
            <Button
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={() =>
                selectedAppointment &&
                handleDecline(selectedAppointment.id, notes)
              }
              disabled={
                actionLoading?.id === selectedAppointment?.id ||
                notes.trim().length < 10
              }
            >
              {actionLoading?.id === selectedAppointment?.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <XCircle className="h-4 w-4 mr-1" />
              )}
              Decline Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Patient Cancel Appointment Dialog */}
      <Dialog
        open={dialogType === "patient_cancel"}
        onOpenChange={() => {
          setDialogType(null);
          setSelectedAppointment(null);
          setNotes("");
        }}
      >
        <DialogContent style={{ backgroundColor: "white" }}>
          <DialogHeader>
            <DialogTitle>Cancel Your Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this appointment? The doctor will
              be notified.{" "}
              <strong>Please provide a reason for cancellation.</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-700">
                <strong>Note:</strong> Cancelling an appointment may affect
                future scheduling. Please try to cancel at least 24 hours in
                advance.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Reason for cancellation <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Please provide a reason for cancelling..."
                value={notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setNotes(e.target.value)
                }
                rows={3}
                className={notes.trim().length < 10 ? "border-red-300" : ""}
              />
              {notes.trim().length < 10 && (
                <p className="text-xs text-red-500">
                  Reason must be at least 10 characters
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                setDialogType(null);
                setSelectedAppointment(null);
                setNotes("");
              }}
            >
              Keep Appointment
            </Button>
            <Button
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={() =>
                selectedAppointment &&
                handlePatientCancel(selectedAppointment.id, notes)
              }
              disabled={
                actionLoading?.id === selectedAppointment?.id ||
                notes.trim().length < 10
              }
            >
              {actionLoading?.id === selectedAppointment?.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <XCircle className="h-4 w-4 mr-1" />
              )}
              Cancel Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Appointment Dialog */}
      <Dialog
        open={dialogType === "reschedule"}
        onOpenChange={() => {
          setDialogType(null);
          setSelectedAppointment(null);
          setNotes("");
          setRescheduleDate("");
          setRescheduleTime("");
        }}
      >
        <DialogContent style={{ backgroundColor: "white" }}>
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Select a new date and time for this appointment. The patient will
              be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                New Date <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                New Time <span className="text-red-500">*</span>
              </label>
              <Input
                type="time"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Reason for rescheduling (optional)
              </label>
              <Textarea
                placeholder="Add a note about why you're rescheduling..."
                value={notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setNotes(e.target.value)
                }
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                setDialogType(null);
                setSelectedAppointment(null);
                setNotes("");
                setRescheduleDate("");
                setRescheduleTime("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-white border-none w-full sm:w-auto"
              onClick={handleReschedule}
              disabled={
                actionLoading?.id === selectedAppointment?.id ||
                !rescheduleDate ||
                !rescheduleTime
              }
            >
              {actionLoading?.id === selectedAppointment?.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <CalendarDays className="h-4 w-4 mr-1" />
              )}
              Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Confirmation Dialog */}
      <Dialog
        open={dialogType === "payment"}
        onOpenChange={() => {
          setDialogType(null);
          setCompletedAppointmentId(null);
          setPaymentAmount("Enter the fee");
          setCopiedUPI(false);
          setPaymentStep("invoice");
          setCreatedPaymentId(null);
        }}
      >
        <DialogContent
          style={{ backgroundColor: "white" }}
          className="max-w-md p-0 overflow-hidden"
        >
          {paymentStep === "invoice" ? (
            <>
              {/* Step 1: Send Invoice */}
              <div className="px-6 pt-6 pb-4">
                <DialogHeader className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Send className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-semibold">
                        Send Invoice
                      </DialogTitle>
                      <DialogDescription className="text-sm mt-0.5">
                        Enter the consultation fee and send the invoice to the
                        patient
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
              </div>

              <div className="px-6 pb-4 space-y-5">
                {/* Payment Amount */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Consultation Fee
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                      ₹
                    </span>
                    <Input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="pl-8 h-12 text-xl font-semibold border-2 focus:border-primary"
                      placeholder="Enter the Fee Amount"
                    />
                  </div>
                </div>

                {/* UPI Payment Info */}
                <div className="rounded-xl border-2 border-gray-100 bg-gray-50/50 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-bold text-sm">₹</span>
                    </div>
                    <span className="font-semibold text-foreground">
                      UPI Payment Details
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        UPI ID
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                          {doctorProfile?.upiId || "Not configured"}
                        </span>
                        {doctorProfile?.upiId && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-gray-200"
                            onClick={() => copyToClipboard(doctorProfile.upiId)}
                          >
                            {copiedUPI ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Name
                      </span>
                      <span className="font-medium text-foreground">
                        Dr. {userData?.name || "Unknown"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer - Send Invoice */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <Button
                  onClick={handleSendInvoice}
                  disabled={
                    sendingInvoice ||
                    !paymentAmount ||
                    parseFloat(paymentAmount) <= 0
                  }
                  className="w-full h-11 bg-blue-500 hover:bg-blue-600 text-white font-medium"
                >
                  {sendingInvoice ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending Invoice...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Invoice
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Step 2: Confirm Payment */}
              <div className="px-6 pt-6 pb-4">
                <DialogHeader className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Banknote className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-semibold">
                        Confirm Payment
                      </DialogTitle>
                      <DialogDescription className="text-sm mt-0.5">
                        Invoice sent! Has the patient made the payment?
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
              </div>

              <div className="px-6 pb-4 space-y-5">
                {/* Patient & Amount Info */}
                <div className="rounded-xl border-2 border-gray-100 bg-gray-50/50 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Patient
                    </span>
                    <span className="font-semibold text-foreground">
                      {completedAppointmentId
                        ? appointments.find(
                            (a) => a.id === completedAppointmentId,
                          )?.patient?.user?.name || "Patient"
                        : "Patient"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Amount
                    </span>
                    <span className="text-2xl font-bold text-foreground">
                      ₹{paymentAmount}
                    </span>
                  </div>
                </div>

                {/* Today's Collection Preview */}
                <div className="rounded-xl bg-green-50 border border-green-100 p-4 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-sm text-green-700">
                    Recording this payment will add{" "}
                    <span className="font-semibold">₹{paymentAmount || 0}</span>{" "}
                    to today&apos;s collection
                  </p>
                </div>
              </div>

              {/* Footer - Paid / Not Paid */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handlePaymentConfirm(false)}
                    className="flex-1 h-11 font-medium"
                  >
                    Not Paid
                  </Button>
                  <Button
                    onClick={() => handlePaymentConfirm(true)}
                    className="flex-1 h-11 bg-green-500 hover:bg-green-600 text-white font-medium"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Paid
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      {/* View Prescription Dialog */}
      <Dialog
        open={dialogType === "view_prescription"}
        onOpenChange={() => {
          setDialogType(null);
          setSelectedAppointment(null);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-w-4xl max-h-[90vh] overflow-hidden p-0 rounded-2xl border-border/80 shadow-2xl"
        >
          <div className="border-b border-border/80 bg-gradient-to-r from-emerald-50 via-white to-teal-50 p-6">
            <DialogHeader className="space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <DialogTitle className="text-xl">
                    Prescription & Bill Details
                  </DialogTitle>
                  <DialogDescription className="text-sm">
                    View your diagnosis, medications, and billing information.
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Summary
                  </span>
                  <DialogClose
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-700 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </DialogClose>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="max-h-[70vh] overflow-y-auto px-6 pb-6 pt-4">
            {selectedAppointment && (
              <div className="space-y-6">
                {/* Bill Section */}
                {selectedAppointment.payment &&
                  selectedAppointment.payment.status === "PAID" && (
                    <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4 sm:p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h4 className="font-semibold text-green-800 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" /> Paid Bill
                          </h4>
                          <p className="text-sm text-green-700">
                            Amount Paid:{" "}
                            <span className="font-bold text-lg">
                              ₹{selectedAppointment.payment.amount}
                            </span>
                          </p>
                        </div>
                        <Badge className="bg-green-200 text-green-800 hover:bg-green-200">
                          PAID
                        </Badge>
                      </div>
                    </div>
                  )}

                {/* Diagnosis */}
                {selectedAppointment.prescription ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="rounded-xl border border-border/70 bg-white p-4 shadow-sm">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">
                          Diagnosis
                        </label>
                        <p className="mt-1 font-medium text-lg">
                          {selectedAppointment.prescription.diagnosis}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border/70 bg-white p-4 shadow-sm">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">
                          Clinical Notes
                        </label>
                        <p className="mt-1 text-sm text-foreground">
                          {selectedAppointment.prescription.notes || "-"}
                        </p>
                      </div>
                    </div>

                    {/* Medications */}
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <Pill className="h-4 w-4 text-primary" /> Medications
                      </h4>
                      {selectedAppointment.prescription.medications.length >
                      0 ? (
                        <div className="rounded-xl border border-border/70 overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="min-w-[720px] w-full text-sm">
                              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                                <tr>
                                  <th className="py-3 px-3 text-left font-medium w-48">
                                    Medicine
                                  </th>
                                  <th className="py-3 px-3 text-left font-medium w-28">
                                    Dosage
                                  </th>
                                  <th className="py-3 px-3 text-left font-medium w-32">
                                    Freq
                                  </th>
                                  <th className="py-3 px-3 text-left font-medium w-28">
                                    Duration
                                  </th>
                                  <th className="py-3 px-3 text-left font-medium">
                                    Instructions
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                {selectedAppointment.prescription.medications.map(
                                  (med, idx) => (
                                    <tr key={idx} className="bg-white">
                                      <td className="py-3 px-3 font-medium align-top">
                                        {med.medicineName}
                                      </td>
                                      <td className="py-3 px-3 align-top">
                                        {med.dosage}
                                      </td>
                                      <td className="py-3 px-3 align-top">
                                        {med.frequency}
                                      </td>
                                      <td className="py-3 px-3 align-top">
                                        {med.duration}
                                      </td>
                                      <td className="py-3 px-3 text-muted-foreground align-top">
                                        {med.instructions || "-"}
                                      </td>
                                    </tr>
                                  ),
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          No medications prescribed.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground bg-muted/20 rounded-lg">
                    <p>Prescription details not available.</p>
                  </div>
                )}

                {/* Attachments */}
                {selectedAppointment.patient?.medicalDocuments &&
                  selectedAppointment.patient.medicalDocuments.filter(
                    (d) => d.documentType === "PRESCRIPTION",
                  ).length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <FileIcon className="h-4 w-4 text-primary" />{" "}
                        Prescription Documents
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedAppointment.patient.medicalDocuments
                          .filter((d) => d.documentType === "PRESCRIPTION")
                          // Simple generic filter, ideally would match date
                          .map((doc) => (
                            <a
                              key={doc.id}
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 rounded-lg border border-border/70 bg-white px-3 py-2 text-sm text-blue-600 transition-colors hover:bg-muted hover:underline"
                            >
                              <FileIcon className="h-4 w-4" />
                              {doc.fileName}
                            </a>
                          ))}
                      </div>
                    </div>
                  )}
              </div>
            )}

            <DialogFooter className="mt-6">
              <Button onClick={() => setDialogType(null)} className="min-w-28">
                Close
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
