"use client";

import { useEffect, useState } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Calendar, Clock, Save, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";

interface Schedule {
  id: string;
  scheduleDate: string;
  startTime: string;
  endTime: string;
  breakStartTime: string | null;
  breakEndTime: string | null;
  slotDuration: number;
  maxPatientsPerSlot: number;
  isActive: boolean;
}

export default function SchedulePage() {
  useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [formData, setFormData] = useState({
    scheduleDate: "",
    startTime: "09:00",
    endTime: "17:00",
    breakStartTime: "",
    breakEndTime: "",
    slotDuration: 30,
    maxPatientsPerSlot: 1,
  });

  // Fetch user data to check role
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/user/me", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          console.log("Schedule page - User data:", data.user);

          // Check if user is doctor (case-insensitive)
          const userRole = data.user?.role?.toUpperCase();
          if (userRole !== "DOCTOR" && userRole !== "ADMIN") {
            console.log("User is not a doctor, redirecting. Role:", userRole);
            router.push("/dashboard");
            return;
          }

          // Fetch schedules after confirming user is doctor
          fetchSchedules();
        } else {
          const errorText = await response.text();
          console.error(
            "Failed to fetch user data:",
            response.status,
            errorText,
          );
          // Only redirect if unauthorized, not for other errors
          if (response.status === 401) {
            router.push("/login");
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        // Don't redirect on network errors, just show loading state
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const fetchSchedules = async () => {
    try {
      const response = await fetch("/api/schedule", { credentials: "include" });
      const data = await response.json();

      if (response.ok) {
        setSchedules(data.schedule || []);
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
      toast.error("Failed to load schedules");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.scheduleDate || !formData.startTime || !formData.endTime) {
      toast.error("Please fill in date and time fields");
      return;
    }

    // Validate date is not in the past
    const selectedDate = new Date(formData.scheduleDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      toast.error("Cannot set schedule for past dates");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save schedule");
      }

      toast.success("Schedule saved successfully");
      setShowForm(false);
      setEditingSchedule(null);
      resetForm();
      fetchSchedules();
    } catch (error) {
      console.error("Error saving schedule:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save schedule",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (scheduleId: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) {
      return;
    }

    try {
      const response = await fetch(`/api/schedule?id=${scheduleId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete schedule");
      }

      toast.success("Schedule deleted successfully");
      fetchSchedules();
    } catch (error) {
      console.error("Error deleting schedule:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete schedule",
      );
    }
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      scheduleDate: format(new Date(schedule.scheduleDate), "yyyy-MM-dd"),
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      breakStartTime: schedule.breakStartTime || "",
      breakEndTime: schedule.breakEndTime || "",
      slotDuration: schedule.slotDuration,
      maxPatientsPerSlot: schedule.maxPatientsPerSlot,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      scheduleDate: "",
      startTime: "09:00",
      endTime: "17:00",
      breakStartTime: "",
      breakEndTime: "",
      slotDuration: 30,
      maxPatientsPerSlot: 1,
    });
  };

  const handleAddNew = () => {
    setEditingSchedule(null);
    resetForm();
    setShowForm(true);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "MMMM d, yyyy");
  };

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "EEEE");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Schedule Management</h1>
          <p className="text-muted-foreground mt-2">
            Set your availability for specific dates. Patients can only book
            appointments on dates you have scheduled.
          </p>
        </div>
        <Button
          onClick={handleAddNew}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Schedule
        </Button>
      </div>

      {/* Upcoming Schedules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Schedules
          </CardTitle>
          <CardDescription>
            Your scheduled availability for patients to book appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No schedules set yet.</p>
              <p className="text-sm">
                Click &quot;Add Schedule&quot; to set your availability for
                specific dates.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="border rounded-lg p-4 bg-green-50/50 border-green-200 hover:bg-green-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {getDayName(schedule.scheduleDate)}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(schedule.scheduleDate)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(schedule)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(schedule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm space-y-1">
                    <p className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {schedule.startTime} - {schedule.endTime}
                    </p>
                    {schedule.breakStartTime && schedule.breakEndTime && (
                      <p className="text-xs text-orange-600">
                        Break: {schedule.breakStartTime} -{" "}
                        {schedule.breakEndTime}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {schedule.slotDuration} min slots
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Schedule Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingSchedule ? "Edit Schedule" : "Add New Schedule"}
            </CardTitle>
            <CardDescription>
              {editingSchedule
                ? `Update schedule for ${formatDate(editingSchedule.scheduleDate)}`
                : "Set your availability for a specific date"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduleDate">Date *</Label>
                <Input
                  id="scheduleDate"
                  type="date"
                  value={formData.scheduleDate}
                  min={format(new Date(), "yyyy-MM-dd")}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduleDate: e.target.value })
                  }
                  disabled={!!editingSchedule}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="breakStartTime">Break Start (Optional)</Label>
                <Input
                  id="breakStartTime"
                  type="time"
                  value={formData.breakStartTime}
                  onChange={(e) =>
                    setFormData({ ...formData, breakStartTime: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="breakEndTime">Break End (Optional)</Label>
                <Input
                  id="breakEndTime"
                  type="time"
                  value={formData.breakEndTime}
                  onChange={(e) =>
                    setFormData({ ...formData, breakEndTime: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slotDuration">Slot Duration</Label>
                <Select
                  value={formData.slotDuration.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, slotDuration: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxPatients">Max Patients per Slot</Label>
                <Input
                  id="maxPatients"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.maxPatientsPerSlot}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxPatientsPerSlot: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                {editingSchedule ? "Update Schedule" : "Save Schedule"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingSchedule(null);
                  resetForm();
                }}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
