"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { Clock, Calendar, Save, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Schedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  maxPatientsPerSlot: number;
  isActive: boolean;
}

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const DEFAULT_SCHEDULE = {
  startTime: "09:00",
  endTime: "17:00",
  slotDuration: 30,
  maxPatientsPerSlot: 1,
  isActive: true,
};

type UserRole = "PATIENT" | "DOCTOR" | "ADMIN";

interface UserData {
  id: string;
  role?: UserRole;
}

export default function SchedulePage() {
  const { data: session, isPending } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);

  const isDoctor = userData?.role === "DOCTOR" || userData?.role === "ADMIN";

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/user/me", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setUserData(data.user);
        }
      } catch {
        // no-op
      } finally {
        setLoadingUser(false);
      }
    };

    if (session?.user) {
      fetchUserData();
    } else if (!isPending) {
      setLoadingUser(false);
    }
  }, [session, isPending]);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const response = await fetch("/api/schedule", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          // Initialize all 7 days with data from API or defaults
          const scheduleMap = new Map<number, Schedule>();
          data.schedule.forEach((s: Schedule) => {
            scheduleMap.set(s.dayOfWeek, s);
          });

          const fullSchedule: Schedule[] = [];
          for (let i = 0; i < 7; i++) {
            if (scheduleMap.has(i)) {
              fullSchedule.push(scheduleMap.get(i)!);
            } else {
              fullSchedule.push({
                id: "",
                dayOfWeek: i,
                ...DEFAULT_SCHEDULE,
                isActive: i !== 0, // Sunday off by default
              });
            }
          }
          setSchedules(fullSchedule);
        }
      } catch {
        toast.error("Failed to load schedule");
      } finally {
        setLoading(false);
      }
    };

    if (!isPending && session) {
      fetchSchedule();
    } else if (!isPending) {
      setLoading(false);
    }
  }, [session, isPending]);

  const handleSave = async (dayOfWeek: number) => {
    const schedule = schedules.find((s) => s.dayOfWeek === dayOfWeek);
    if (!schedule) return;

    setSaving(dayOfWeek);
    try {
      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          slotDuration: schedule.slotDuration,
          maxPatientsPerSlot: schedule.maxPatientsPerSlot,
          isActive: schedule.isActive,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSchedules((prev) =>
          prev.map((s) =>
            s.dayOfWeek === dayOfWeek ? { ...s, id: data.schedule.id } : s,
          ),
        );
        toast.success(`${DAYS_OF_WEEK[dayOfWeek]} schedule saved`);
      } else {
        toast.error("Failed to save schedule");
      }
    } catch {
      toast.error("Failed to save schedule");
    } finally {
      setSaving(null);
    }
  };

  const updateSchedule = (dayOfWeek: number, updates: Partial<Schedule>) => {
    setSchedules((prev) =>
      prev.map((s) => (s.dayOfWeek === dayOfWeek ? { ...s, ...updates } : s)),
    );
  };

  if (isPending || loadingUser || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isDoctor) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="font-heading text-2xl">
              Schedule Management
            </CardTitle>
            <CardDescription>
              Only doctors can manage the appointment schedule.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="font-heading text-2xl">
                Appointment Schedule
              </CardTitle>
              <CardDescription>
                Set your available hours for each day of the week. Patients will
                only see time slots based on this schedule.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {schedules.map((schedule) => (
            <div
              key={schedule.dayOfWeek}
              className={`rounded-lg border p-4 space-y-4 ${
                schedule.isActive
                  ? "border-border bg-card"
                  : "border-border/50 bg-muted/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      schedule.isActive ? "bg-green-500" : "bg-muted-foreground"
                    }`}
                  />
                  <h3 className="font-medium text-lg">
                    {DAYS_OF_WEEK[schedule.dayOfWeek]}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground">
                    Active
                  </Label>
                  <input
                    type="checkbox"
                    checked={schedule.isActive}
                    onChange={(e) =>
                      updateSchedule(schedule.dayOfWeek, {
                        isActive: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-border"
                  />
                </div>
              </div>

              {schedule.isActive && (
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label className="text-sm flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Start Time
                    </Label>
                    <Input
                      type="time"
                      value={schedule.startTime}
                      onChange={(e) =>
                        updateSchedule(schedule.dayOfWeek, {
                          startTime: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm flex items-center gap-1">
                      <Clock className="h-3 w-3" /> End Time
                    </Label>
                    <Input
                      type="time"
                      value={schedule.endTime}
                      onChange={(e) =>
                        updateSchedule(schedule.dayOfWeek, {
                          endTime: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Slot Duration</Label>
                    <Select
                      value={schedule.slotDuration.toString()}
                      onValueChange={(value) =>
                        updateSchedule(schedule.dayOfWeek, {
                          slotDuration: parseInt(value),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="20">20 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">60 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={() => handleSave(schedule.dayOfWeek)}
                      disabled={saving === schedule.dayOfWeek}
                      className="w-full"
                    >
                      {saving === schedule.dayOfWeek ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {!schedule.isActive && (
                <p className="text-sm text-muted-foreground">
                  Closed - No appointments available
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
