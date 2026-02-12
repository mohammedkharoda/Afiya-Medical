import { useMemo, useEffect, useState } from "react";
import { Appointment } from "@/components/appointments/types";

export function useVideoConsultationCategories(appointments: Appointment[]) {
  const [timeTick, setTimeTick] = useState(0);

  const getJoinTimes = (appointment: Appointment) => {
    const dateStr = String(appointment.appointmentDate).split("T")[0];
    const appointmentDateTime = new Date(
      `${dateStr} ${appointment.appointmentTime}`,
    );

    const earlyJoinMinutes = 15;
    const earlyJoinTime = new Date(
      appointmentDateTime.getTime() - earlyJoinMinutes * 60 * 1000,
    );
    const lateJoinTime = new Date(
      appointmentDateTime.getTime() + 120 * 60 * 1000,
    );

    return { earlyJoinTime, lateJoinTime };
  };

  // Check if appointment is in join window (15 min before to 2 hours after)
  const isInJoinWindow = (appointment: Appointment): boolean => {
    const now = new Date();
    const { earlyJoinTime, lateJoinTime } = getJoinTimes(appointment);

    return now >= earlyJoinTime && now <= lateJoinTime;
  };

  const isExpiredMeeting = (appointment: Appointment): boolean => {
    const now = new Date();
    const { lateJoinTime } = getJoinTimes(appointment);
    return now > lateJoinTime;
  };

  // Categorize appointments
  const categories = useMemo(() => {
    const scheduled: Appointment[] = [];
    const upcoming: Appointment[] = [];
    const past: Appointment[] = [];

    appointments.forEach((appointment) => {
      // Past: Completed, cancelled, or declined
      if (["COMPLETED", "CANCELLED", "DECLINED"].includes(appointment.status)) {
        past.push(appointment);
      }
      // Past: Scheduled/rescheduled appointments where meeting window has expired
      else if (
        ["SCHEDULED", "RESCHEDULED"].includes(appointment.status) &&
        isExpiredMeeting(appointment)
      ) {
        past.push(appointment);
      }
      // Upcoming: Ready to join now
      else if (
        ["SCHEDULED", "RESCHEDULED"].includes(appointment.status) &&
        appointment.depositPaid &&
        isInJoinWindow(appointment)
      ) {
        upcoming.push(appointment);
      }
      // Scheduled: Waiting for approval, deposit, or appointment time
      else {
        scheduled.push(appointment);
      }
    });

    return { scheduled, upcoming, past };
  }, [appointments, timeTick]);

  // Refresh every 30 seconds to update time-based categories
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeTick((n) => n + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return categories;
}
