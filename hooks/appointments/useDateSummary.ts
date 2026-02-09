import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Appointment } from "@/components/appointments/types";
import { getLocalDateKey, csvEscape } from "@/components/appointments/utils";

export function useDateSummary(appointments: Appointment[]) {
  const [summaryDate, setSummaryDate] = useState<Date>(new Date());
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

  const summaryKey = useMemo(
    () => getLocalDateKey(summaryDate),
    [summaryDate],
  );

  const summaryLabel = useMemo(
    () =>
      summaryDate.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    [summaryDate],
  );

  const selectedDateAppointments = useMemo(
    () =>
      appointments.filter(
        (appointment) =>
          getLocalDateKey(appointment.appointmentDate) === summaryKey,
      ),
    [appointments, summaryKey],
  );

  const selectedBookedCount = useMemo(
    () =>
      selectedDateAppointments.filter(
        (appointment) =>
          appointment.status !== "CANCELLED" &&
          appointment.status !== "DECLINED",
      ).length,
    [selectedDateAppointments],
  );

  const selectedRemainingCount = useMemo(
    () =>
      selectedDateAppointments.filter((appointment) =>
        ["PENDING", "SCHEDULED", "RESCHEDULED"].includes(appointment.status),
      ).length,
    [selectedDateAppointments],
  );

  const selectedCompletedCount = useMemo(
    () =>
      selectedDateAppointments.filter(
        (appointment) => appointment.status === "COMPLETED",
      ).length,
    [selectedDateAppointments],
  );

  const completedSelectedAppointments = useMemo(
    () =>
      selectedDateAppointments.filter(
        (appointment) => appointment.status === "COMPLETED",
      ),
    [selectedDateAppointments],
  );

  const visibleAppointments = useMemo(
    () => (showSelectedOnly ? selectedDateAppointments : appointments),
    [showSelectedOnly, selectedDateAppointments, appointments],
  );

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

  return {
    summaryDate,
    setSummaryDate,
    showSelectedOnly,
    setShowSelectedOnly,
    summaryLabel,
    selectedBookedCount,
    selectedRemainingCount,
    selectedCompletedCount,
    completedSelectedAppointments,
    visibleAppointments,
    handleDownloadSelectedCompleted,
  };
}
