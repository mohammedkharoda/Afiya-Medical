"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, CheckCircle, Clock, RefreshCw, Users } from "lucide-react";

interface Appointment {
  id: string;
  appointmentDate: string;
  status: string;
  patient?: {
    address?: string;
    user?: {
      name?: string;
      phone?: string;
    };
  };
  prescription?: {
    followUpDate?: string | null;
  };
}

export default function DoctorAppointmentsSummaryPage() {
  useSession();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const getMonthKey = (value: string | Date) => {
    const date = new Date(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
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

  const fetchAppointments = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/appointments", {
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok) {
        setAppointments(data.appointments || []);
      } else {
        toast.error(data.error || "Failed to load appointments");
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to load appointments");
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/user/me", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          const userRole = data.user?.role?.toUpperCase();
          if (userRole !== "DOCTOR" && userRole !== "ADMIN") {
            router.push("/dashboard");
            return;
          }
          fetchAppointments();
        } else if (response.status === 401) {
          router.push("/login");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const monthAppointments = useMemo(
    () =>
      appointments.filter(
        (appointment) => getMonthKey(appointment.appointmentDate) === month,
      ),
    [appointments, month],
  );

  const servedCount = monthAppointments.filter(
    (appointment) => appointment.status === "COMPLETED",
  ).length;
  const remainingCount = monthAppointments.filter((appointment) =>
    ["PENDING", "SCHEDULED", "RESCHEDULED"].includes(appointment.status),
  ).length;

  const followUpsInMonth = useMemo(() => {
    return appointments
      .filter(
        (appointment) =>
          appointment.prescription?.followUpDate &&
          getMonthKey(appointment.prescription.followUpDate) === month,
      )
      .sort(
        (a, b) =>
          new Date(a.prescription?.followUpDate || 0).getTime() -
          new Date(b.prescription?.followUpDate || 0).getTime(),
      );
  }, [appointments, month]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Monthly Appointment Summary
          </h1>
          <p className="text-muted-foreground mt-2">
            Track served patients, remaining visits, and follow-ups by month.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="w-[160px]"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={fetchAppointments}
            disabled={isRefreshing}
            title="Refresh appointments"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="h-4 w-4 text-primary" /> Served
            </CardTitle>
            <CardDescription>Completed appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{servedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              For selected month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-primary" /> Remaining
            </CardTitle>
            <CardDescription>Pending or scheduled visits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{remainingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              For selected month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" /> Returning
            </CardTitle>
            <CardDescription>Follow-up patients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {followUpsInMonth.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Follow-ups in month
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" /> Follow-up schedule
          </CardTitle>
          <CardDescription>
            Patients who are expected to return this month.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {followUpsInMonth.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No follow-up visits scheduled for this month.
            </p>
          ) : (
            <div className="space-y-3">
              {followUpsInMonth.map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-lg border border-border p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <div>
                    <p className="font-medium">
                      {appointment.patient?.user?.name || "Patient"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {appointment.patient?.user?.phone || "No phone"}
                    </p>
                  </div>
                  <Badge variant="outline" className="w-fit">
                    {appointment.prescription?.followUpDate
                      ? formatDate(appointment.prescription.followUpDate)
                      : "Follow-up date"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
