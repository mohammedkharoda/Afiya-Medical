"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  FileText,
  ClipboardList,
  Clock,
  Users,
  ChevronRight,
  Plus,
  CreditCard,
} from "lucide-react";
import { useLoadingStore } from "@/stores/loading-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Appointment {
  id: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  symptoms?: string;
  notes?: string;
  patient?: {
    user?: {
      name?: string;
      email?: string;
      phone?: string;
    };
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [checkingMedicalHistory, setCheckingMedicalHistory] = useState(true);
  const [upcomingAppointments, setUpcomingAppointments] = useState<
    Appointment[]
  >([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);

  // Use centralized loading store - userData is already fetched by layout
  const { userData } = useLoadingStore();

  const userRole = userData?.role;
  const rawName = userData?.name || "";
  const fallbackEmail = userData?.email || "";
  const displayName =
    rawName || (fallbackEmail ? fallbackEmail.split("@")[0] : "User");

  // Only set role flags when role is actually loaded to prevent flash
  const isPatient = userRole === "PATIENT";
  const isDoctor = userRole === "DOCTOR";
  const isAdmin = userRole === "ADMIN";

  // Skip medical history check immediately if not a patient or no user data
  useEffect(() => {
    if (!userData) return;
    if (userRole !== "PATIENT") {
      setCheckingMedicalHistory(false);
    }
  }, [userData, userRole]);

  // Check medical history for patients
  useEffect(() => {
    const checkMedicalHistory = async () => {
      if (!userData) return;

      // For non-patient roles, skip medical history check
      if (userRole !== "PATIENT") {
        setCheckingMedicalHistory(false);
        return;
      }

      try {
        const response = await fetch("/api/medical-history", {
          credentials: "include",
        });
        const data = await response.json();

        if (!data.medicalHistory) {
          router.push("/medical-history/new");
          return;
        }
      } catch (error) {
        console.error("Error checking medical history:", error);
      }

      setCheckingMedicalHistory(false);
    };

    if (userData) {
      checkMedicalHistory();
    }
  }, [userData, userRole, router]);

  // Fetch upcoming appointments
  const fetchAppointments = useCallback(async () => {
    try {
      const response = await fetch("/api/appointments", {
        credentials: "include",
      });
      const data = await response.json();

      if (data.appointments) {
        // Filter to only upcoming/scheduled appointments and take first 3
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming = data.appointments
          .filter((apt: Appointment) => {
            const aptDate = new Date(apt.appointmentDate);
            return (
              (apt.status === "SCHEDULED" || apt.status === "RESCHEDULED") &&
              aptDate >= today
            );
          })
          .sort(
            (a: Appointment, b: Appointment) =>
              new Date(a.appointmentDate).getTime() -
              new Date(b.appointmentDate).getTime(),
          )
          .slice(0, 3);
        setUpcomingAppointments(upcoming);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoadingAppointments(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // The layout's LoadingOverlay handles initial loading.
  // Here we only need to wait for medical history check for patients.
  // For non-patients, checkingMedicalHistory will be set to false immediately.
  const isCheckingPatientHistory = isPatient && checkingMedicalHistory;

  // Quick action cards based on role
  const getQuickActions = () => {
    if (isPatient) {
      return [
        {
          title: "Book Appointment",
          description: "Schedule a new appointment with a doctor",
          icon: <Calendar className="h-6 w-6 text-primary" />,
          href: "/appointments/new",
          color: "bg-primary/10",
        },
        {
          title: "View Prescriptions",
          description: "Access your medication history",
          icon: <FileText className="h-6 w-6 text-primary" />,
          href: "/prescriptions",
          color: "bg-primary/10",
        },
        {
          title: "Medical History",
          description: "Update your health information",
          icon: <ClipboardList className="h-6 w-6 text-primary" />,
          href: "/medical-history",
          color: "bg-primary/10",
        },
        {
          title: "Payments",
          description: "Review your payment history",
          icon: <CreditCard className="h-6 w-6 text-primary" />,
          href: "/payments",
          color: "bg-primary/10",
        },
      ];
    }

    if (isDoctor) {
      return [
        {
          title: "Schedule Management",
          description: "Manage your weekly availability",
          icon: <Clock className="h-6 w-6 text-primary" />,
          href: "/doctor/schedule",
          color: "bg-primary/10",
        },
        {
          title: "Revenue Dashboard",
          description: "Track your earnings and analytics",
          icon: <CreditCard className="h-6 w-6 text-primary" />,
          href: "/doctor/revenue",
          color: "bg-primary/10",
        },
      ];
    }

    if (isAdmin) {
      return [
        {
          title: "Manage Users",
          description: "View and manage system users",
          icon: <Users className="h-6 w-6 text-primary" />,
          href: "/users",
          color: "bg-primary/10",
        },
        {
          title: "Appointments",
          description: "Overview of all appointments",
          icon: <Calendar className="h-6 w-6 text-primary" />,
          href: "/appointments",
          color: "bg-primary/10",
        },
      ];
    }

    return [];
  };

  // Stats based on role
  const getStats = () => {
    // Calculate today's appointments for doctors
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    const todaysAppointments = upcomingAppointments.filter((apt) => {
      const aptDate = new Date(apt.appointmentDate).toISOString().split("T")[0];
      return aptDate === todayStr;
    }).length;

    if (isPatient) {
      return [
        {
          label: "Upcoming Appointments",
          value: upcomingAppointments.length.toString(),
          icon: <Calendar className="h-5 w-5" />,
        },
      ];
    }

    if (isDoctor) {
      return [
        {
          label: "Today's Appointments",
          value: todaysAppointments.toString(),
          icon: <Clock className="h-5 w-5" />,
        },
        {
          label: "Upcoming Total",
          value: upcomingAppointments.length.toString(),
          icon: <Calendar className="h-5 w-5" />,
        },
      ];
    }

    if (isAdmin) {
      return [
        {
          label: "Total Users",
          value: "0",
          icon: <Users className="h-5 w-5" />,
        },
      ];
    }

    return [];
  };

  const quickActions = getQuickActions();
  const stats = getStats();

  // If still checking medical history for patients, return null
  // The layout will continue showing the LoadingOverlay during redirect
  if (isCheckingPatientHistory) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-primary/10 text-primary";
      case "COMPLETED":
        return "bg-green-100 text-green-700";
      case "CANCELLED":
        return "bg-destructive/10 text-destructive";
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
    });
  };

  return (
    <div className="space-y-6 max-w-full">
      {/* Welcome Section */}
      <div className="rounded-xl bg-linear-to-r from-primary/10 via-primary/5 to-transparent p-4 sm:p-6">
        <h2 className="font-heading text-xl font-semibold text-foreground sm:text-2xl md:text-3xl">
          Welcome back, {displayName.split(" ")[0]}!
        </h2>
        <p className="mt-1 text-sm sm:text-base text-muted-foreground">
          {isPatient && "Here's an overview of your health dashboard."}
          {isDoctor && "Here's your schedule and patient overview."}
          {isAdmin && "Here's the system overview for today."}
          {!isPatient &&
            !isDoctor &&
            !isAdmin &&
            "Here's an overview of your dashboard."}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => (
          <Card key={index} className="border-border">
            <CardContent className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                {stat.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-semibold text-foreground">
                  {stat.value}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {stat.label}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="mb-3 sm:mb-4 font-heading text-base sm:text-lg font-semibold text-foreground">
          Quick Actions
        </h3>
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Card className="group h-full cursor-pointer border-border transition-all hover:border-primary hover:shadow-md">
                <CardContent className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4">
                  <div
                    className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg shrink-0 ${action.color}`}
                  >
                    {action.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm sm:text-base text-foreground group-hover:text-primary truncate">
                      {action.title}
                    </h4>
                    <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-muted-foreground line-clamp-2">
                      {action.description}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Upcoming Appointments Section */}
      <Card className="border-border">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
          <div>
            <CardTitle className="font-heading text-base sm:text-lg">
              {isPatient
                ? "Your Upcoming Appointments"
                : "Upcoming Appointments"}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {isPatient
                ? "Your scheduled appointments with doctors"
                : "Next appointments on your schedule"}
            </CardDescription>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
          >
            <Link href="/appointments">
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loadingAppointments ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">
                No upcoming appointments
              </p>
              {isPatient && (
                <Button asChild className="mt-4" size="sm" variant="accent">
                  <Link href="/appointments/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Book Appointment
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {upcomingAppointments.map((appointment) => (
                <Link
                  key={appointment.id}
                  href={`/appointments`}
                  className="flex items-center justify-between rounded-lg border border-border p-2 sm:p-3 transition-colors hover:bg-accent/50 cursor-pointer gap-2"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm sm:text-base text-foreground truncate">
                        {isDoctor || isAdmin
                          ? appointment.patient?.user?.name || "Patient"
                          : "Appointment"}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {formatDate(appointment.appointmentDate)} at{" "}
                        {appointment.appointmentTime}
                      </p>
                      {appointment.symptoms && (
                        <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1">
                          {appointment.symptoms}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge
                    className={`${getStatusColor(appointment.status)} text-xs shrink-0`}
                  >
                    {appointment.status}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
