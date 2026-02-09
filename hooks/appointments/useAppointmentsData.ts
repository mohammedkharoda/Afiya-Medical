import { useState, useCallback, useEffect } from "react";
import { Appointment } from "@/components/appointments/types";
import { usePusherAppointments } from "@/hooks/use-pusher-notifications";

const sortAppointments = (appointments: Appointment[]) => {
  return [...appointments].sort((a, b) => {
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
  });
};

export function useAppointmentsData() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAppointments = useCallback(async () => {
    try {
      const response = await fetch("/api/appointments", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json();

      if (response.ok) {
        setAppointments(sortAppointments(data.appointments || []));
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
      fetchAppointments();
    }, [fetchAppointments]),
  );

  // Fetch appointments on mount
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAppointments();
    setIsRefreshing(false);
  };

  return {
    appointments,
    setAppointments,
    loading,
    isRefreshing,
    fetchAppointments,
    handleRefresh,
  };
}
