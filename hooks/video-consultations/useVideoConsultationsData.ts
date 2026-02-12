import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Appointment } from "@/components/appointments/types";
import { usePusherAppointments } from "@/hooks/use-pusher-notifications";

export function useVideoConsultationsData() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch video consultations
  const fetchVideoConsultations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/appointments?type=video", {
        cache: "no-store",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch video consultations");
      }

      const data = await response.json();
      setAppointments(data.appointments || []);
    } catch (error) {
      console.error("Error fetching video consultations:", error);
      toast.error("Failed to load video consultations");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchVideoConsultations();
  }, [fetchVideoConsultations]);

  // Real-time updates via Pusher
  usePusherAppointments(
    useCallback(() => {
      fetchVideoConsultations();
    }, [fetchVideoConsultations])
  );

  return { appointments, loading, refetch: fetchVideoConsultations };
}
