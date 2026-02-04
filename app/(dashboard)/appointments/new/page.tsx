"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import Link from "next/link";
import { format } from "date-fns";
import {
  CalendarDays,
  Clock,
  FileText,
  Stethoscope,
  CalendarIcon,
  User,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type UserRole = "PATIENT" | "DOCTOR" | "ADMIN";

interface UserData {
  id: string;
  email: string;
  name: string;
  role?: UserRole;
}

interface PreferredDoctor {
  id: string;
  name: string;
  speciality: string;
}

function AppointmentBookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isPending } = useSession();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [preferredDoctor, setPreferredDoctor] =
    useState<PreferredDoctor | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [slots, setSlots] = useState<string[]>([]);
  const [noScheduleMessage, setNoScheduleMessage] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [symptoms, setSymptoms] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Check if form is ready to submit
  const canSubmit =
    selectedDate && selectedTime && preferredDoctor && !submitting;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/user/me", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched user data:", data.user);
          setUserData(data.user);
          if (data.preferredDoctor) {
            setPreferredDoctor(data.preferredDoctor);
          }
        } else if (response.status === 401) {
          toast.error("Your session has expired. Please log in again.");
          window.location.href = "/login?expired=true";
          return;
        } else {
          console.log("Failed to fetch user data, status:", response.status);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserData();
  }, []);

  const isPatient = userData?.role === "PATIENT";

  useEffect(() => {
    const initialDate = searchParams.get("date");
    if (initialDate) {
      setSelectedDate(new Date(initialDate));
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDate) {
        console.log("No date selected, skipping fetch");
        return;
      }
      if (!userData) {
        console.log("No user data yet, skipping fetch");
        return;
      }
      if (!preferredDoctor) {
        console.log("No preferred doctor, skipping fetch");
        setSlots([]);
        setNoScheduleMessage("No doctor assigned. Please contact support.");
        return;
      }

      const dateStr = format(selectedDate, "yyyy-MM-dd");
      console.log(
        "Fetching slots for date:",
        dateStr,
        "doctor:",
        preferredDoctor.id,
      );
      setLoadingSlots(true);
      setSlots([]);
      setSelectedTime("");
      setNoScheduleMessage("");
      try {
        const response = await fetch(
          `/api/appointments/available-slots?date=${encodeURIComponent(dateStr)}&doctorId=${encodeURIComponent(preferredDoctor.id)}`,
          { credentials: "include" },
        );
        const data = await response.json();
        console.log("Available slots response:", data);
        console.log("Slots array:", data.slots, "Length:", data.slots?.length);

        if (!response.ok) {
          toast.error(data.error || "Failed to load available slots");
          return;
        }

        if (data.message) {
          console.log("Setting noScheduleMessage:", data.message);
          setNoScheduleMessage(data.message);
          setSlots([]);
        } else {
          setSlots(data.slots || []);
          setNoScheduleMessage("");
        }
      } catch {
        toast.error("Failed to load available slots");
      } finally {
        setLoadingSlots(false);
      }
    };

    if (!loadingUser) {
      fetchSlots();
    }
  }, [selectedDate, userData, loadingUser, preferredDoctor]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedDate || !selectedTime) {
      toast.error("Please select a date and time");
      return;
    }

    if (!preferredDoctor) {
      toast.error("No doctor assigned. Please contact support.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentDate: format(selectedDate, "yyyy-MM-dd"),
          appointmentTime: selectedTime,
          symptoms,
          notes,
          doctorId: preferredDoctor.id,
        }),
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to book appointment");
        return;
      }

      toast.success("Appointment booked successfully");
      router.push("/appointments");
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setCalendarOpen(false);
  };

  if (isPending || loadingUser) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (userData && !isPatient) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="font-heading text-2xl">
              Appointment Booking
            </CardTitle>
            <CardDescription>
              Only patients can book appointments.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Button asChild>
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card className="border-border">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Stethoscope className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="font-heading text-2xl">
                Book Appointment
              </CardTitle>
              <CardDescription>
                Choose a date and time to schedule your visit.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Assigned Doctor Display */}
            <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4">
              <Label className="flex items-center gap-2 font-medium text-foreground mb-3">
                <Stethoscope className="h-4 w-4 text-primary" />
                Your Doctor
              </Label>
              {preferredDoctor ? (
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">
                      Dr. {preferredDoctor.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {preferredDoctor.speciality}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                  <p className="text-sm text-orange-800">
                    No doctor assigned. Please contact support or update your
                    profile.
                  </p>
                </div>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Date Picker Section */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 font-medium text-foreground">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Select Date
                </Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-11",
                        !selectedDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? (
                        format(selectedDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Slots Section */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 font-medium text-foreground">
                  <Clock className="h-4 w-4 text-primary" />
                  Select Time
                  {selectedTime && (
                    <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                      {selectedTime}
                    </span>
                  )}
                </Label>
                <div className="rounded-lg border border-border p-4 min-h-50">
                  {loadingSlots ? (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Loading available slots...
                    </div>
                  ) : noScheduleMessage ? (
                    <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                      <p className="text-sm text-orange-800 font-medium">
                        {noScheduleMessage}
                      </p>
                    </div>
                  ) : !selectedDate ? (
                    <p className="text-sm text-muted-foreground">
                      Select a date to see available slots.
                    </p>
                  ) : slots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      All slots are booked for this date. Please select another
                      date.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {slots.map((slot) => (
                        <Button
                          key={slot}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTime(slot)}
                          className={
                            selectedTime === slot
                              ? "bg-green-500 text-white border-green-500 hover:bg-green-600 hover:text-white hover:border-green-600"
                              : "hover:border-green-400 hover:text-green-600"
                          }
                        >
                          {slot}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 font-medium text-foreground">
                <FileText className="h-4 w-4 text-primary" />
                Symptoms
              </Label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Describe your symptoms"
                className="w-full rounded-lg border-2 border-input bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 font-medium text-foreground">
                <FileText className="h-4 w-4 text-primary" />
                Notes (optional)
              </Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes for the doctor"
                className="w-full rounded-lg border-2 border-input bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                rows={3}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="submit"
                disabled={!canSubmit}
                className={
                  canSubmit
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }
              >
                {submitting ? "Booking..." : "Book Appointment"}
              </Button>
              <Button variant="outline" asChild>
                <Link href="/appointments">View Appointments</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AppointmentBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <AppointmentBookingContent />
    </Suspense>
  );
}
