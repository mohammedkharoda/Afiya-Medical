"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ClipboardList,
  Edit,
  AlertCircle,
  Pill,
  Activity,
  Stethoscope,
  Users,
  X,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

interface MedicalHistoryData {
  id: string;
  patientId: string;
  conditions: string[];
  allergies: string[];
  currentMedications: string[];
  surgeries: string[];
  familyHistory: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DoctorOption {
  id: string;
  name: string;
  speciality?: string | null;
  hasAvailability?: boolean;
}

export default function MedicalHistoryPage() {
  const [medicalHistory, setMedicalHistory] =
    useState<MedicalHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [preferredDoctorId, setPreferredDoctorId] = useState<string>("NONE");
  const [initialPreferredDoctorId, setInitialPreferredDoctorId] =
    useState<string>("NONE");

  // Form state
  const [conditions, setConditions] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [currentMedications, setCurrentMedications] = useState<string[]>([]);
  const [surgeries, setSurgeries] = useState<string[]>([]);
  const [familyHistory, setFamilyHistory] = useState("");

  // Input fields for adding new items
  const [newCondition, setNewCondition] = useState("");
  const [newAllergy, setNewAllergy] = useState("");
  const [newMedication, setNewMedication] = useState("");
  const [newSurgery, setNewSurgery] = useState("");

  const testDoctorOption: DoctorOption = {
    id: "TEST_DOCTOR",
    name: "Test Doctor",
    speciality: "Demo",
  };

  const doctorOptions = doctors.some((doctor) => doctor.id === "TEST_DOCTOR")
    ? doctors
    : [...doctors, testDoctorOption];

  useEffect(() => {
    const fetchMedicalHistory = async () => {
      try {
        const [historyResponse, userResponse, doctorsResponse] =
          await Promise.all([
            fetch("/api/medical-history", { credentials: "include" }),
            fetch("/api/user/me", { credentials: "include" }),
            fetch("/api/doctors", { credentials: "include" }),
          ]);

        if (historyResponse.ok) {
          const data = await historyResponse.json();
          if (data.medicalHistory) {
            setMedicalHistory(data.medicalHistory);
            // Initialize form state
            setConditions(data.medicalHistory.conditions || []);
            setAllergies(data.medicalHistory.allergies || []);
            setCurrentMedications(data.medicalHistory.currentMedications || []);
            setSurgeries(data.medicalHistory.surgeries || []);
            setFamilyHistory(data.medicalHistory.familyHistory || "");
          }
        }

        if (userResponse.ok) {
          const data = await userResponse.json();
          const preferredId = data.preferredDoctor?.id || "NONE";
          setPreferredDoctorId(preferredId);
          setInitialPreferredDoctorId(preferredId);
        }

        if (doctorsResponse.ok) {
          const data = await doctorsResponse.json();
          setDoctors(data.doctors || []);
        }
      } catch (error) {
        console.error("Error fetching medical history:", error);
        toast.error("Failed to load medical history");
      } finally {
        setLoading(false);
      }
    };

    fetchMedicalHistory();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const method = medicalHistory ? "PATCH" : "POST";
      const response = await fetch("/api/medical-history", {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          conditions,
          allergies,
          currentMedications,
          surgeries,
          familyHistory,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMedicalHistory(data.medicalHistory);

        if (
          preferredDoctorId !== initialPreferredDoctorId &&
          preferredDoctorId !== "TEST_DOCTOR"
        ) {
          const updateResponse = await fetch("/api/patient/preferred-doctor", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              preferredDoctorId:
                preferredDoctorId === "NONE" ? null : preferredDoctorId,
            }),
          });

          if (!updateResponse.ok) {
            const error = await updateResponse.json();
            toast.error(error.error || "Failed to update doctor");
          } else {
            setInitialPreferredDoctorId(preferredDoctorId);
          }
        } else if (preferredDoctorId === "TEST_DOCTOR") {
          setInitialPreferredDoctorId(preferredDoctorId);
        }

        setIsEditing(false);
        toast.success("Medical history updated successfully");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save medical history");
      }
    } catch (error) {
      console.error("Error saving medical history:", error);
      toast.error("Failed to save medical history");
    } finally {
      setSaving(false);
    }
  };

  const addItem = (
    list: string[],
    setList: (items: string[]) => void,
    newItem: string,
    setNewItem: (item: string) => void,
  ) => {
    if (newItem.trim()) {
      setList([...list, newItem.trim()]);
      setNewItem("");
    }
  };

  const removeItem = (
    list: string[],
    setList: (items: string[]) => void,
    index: number,
  ) => {
    setList(list.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading medical history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-semibold text-foreground flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            Medical History
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage your medical records
          </p>
        </div>
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogTrigger asChild>
            <Button className="bg-black text-white font-bold hover:bg-primary/90">
              <Edit className="h-4 w-4 mr-2" />
              Edit Medical History
            </Button>
          </DialogTrigger>
          <DialogContent
            className="max-w-2xl w-full max-h-[90vh] overflow-hidden"
            style={{ backgroundColor: "white" }}
          >
            <DialogHeader>
              <DialogTitle className="text-foreground">
                Edit Medical History
              </DialogTitle>
              <DialogDescription>
                Update your medical information to help your doctor provide
                better care.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4 max-h-[65vh] overflow-y-auto pr-2">
              {/* Preferred Doctor */}
              <div className="space-y-3">
                <Label className="text-base font-medium text-foreground">
                  Preferred Doctor
                </Label>
                <Select
                  value={preferredDoctorId}
                  onValueChange={setPreferredDoctorId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a doctor" />
                  </SelectTrigger>
                  <SelectContent
                    className="z-[10000]"
                    position="popper"
                    sideOffset={6}
                  >
                    <SelectItem value="NONE">No preference</SelectItem>
                    {doctorOptions.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.name}
                        {doctor.speciality ? ` • ${doctor.speciality}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Conditions */}
              <div className="space-y-3">
                <Label className="text-base font-medium text-foreground">
                  Medical Conditions
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Diabetes, Hypertension"
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      (e.preventDefault(),
                      addItem(
                        conditions,
                        setConditions,
                        newCondition,
                        setNewCondition,
                      ))
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      addItem(
                        conditions,
                        setConditions,
                        newCondition,
                        setNewCondition,
                      )
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {conditions.map((item, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gray-100 text-foreground border border-gray-200"
                    >
                      {item}
                      <button
                        onClick={() =>
                          removeItem(conditions, setConditions, index)
                        }
                        className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Allergies */}
              <div className="space-y-3">
                <Label className="text-base font-medium text-foreground">
                  Allergies
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Penicillin, Peanuts"
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      (e.preventDefault(),
                      addItem(
                        allergies,
                        setAllergies,
                        newAllergy,
                        setNewAllergy,
                      ))
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      addItem(
                        allergies,
                        setAllergies,
                        newAllergy,
                        setNewAllergy,
                      )
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {allergies.map((item, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gray-100 text-foreground border border-gray-200"
                    >
                      {item}
                      <button
                        onClick={() =>
                          removeItem(allergies, setAllergies, index)
                        }
                        className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Current Medications */}
              <div className="space-y-3">
                <Label className="text-base font-medium text-foreground">
                  Current Medications
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Metformin 500mg"
                    value={newMedication}
                    onChange={(e) => setNewMedication(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      (e.preventDefault(),
                      addItem(
                        currentMedications,
                        setCurrentMedications,
                        newMedication,
                        setNewMedication,
                      ))
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      addItem(
                        currentMedications,
                        setCurrentMedications,
                        newMedication,
                        setNewMedication,
                      )
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentMedications.map((item, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gray-100 text-foreground border border-gray-200"
                    >
                      {item}
                      <button
                        onClick={() =>
                          removeItem(
                            currentMedications,
                            setCurrentMedications,
                            index,
                          )
                        }
                        className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Surgeries */}
              <div className="space-y-3">
                <Label className="text-base font-medium text-foreground">
                  Past Surgeries
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Appendectomy (2020)"
                    value={newSurgery}
                    onChange={(e) => setNewSurgery(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      (e.preventDefault(),
                      addItem(
                        surgeries,
                        setSurgeries,
                        newSurgery,
                        setNewSurgery,
                      ))
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      addItem(
                        surgeries,
                        setSurgeries,
                        newSurgery,
                        setNewSurgery,
                      )
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {surgeries.map((item, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gray-100 text-foreground border border-gray-200"
                    >
                      {item}
                      <button
                        onClick={() =>
                          removeItem(surgeries, setSurgeries, index)
                        }
                        className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Family History */}
              <div className="space-y-3">
                <Label className="text-base font-medium text-foreground">
                  Family Medical History
                </Label>
                <Input
                  placeholder="e.g., Father: Heart disease, Mother: Diabetes"
                  value={familyHistory}
                  onChange={(e) => setFamilyHistory(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-black text-white hover:bg-black/90"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Content */}
      {!medicalHistory ? (
        <Card className="border-border bg-white">
          <CardContent className="py-12">
            <div className="text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-foreground text-lg font-medium">
                No medical history found.
              </p>
              <p className="text-muted-foreground text-sm mt-2 mb-4">
                Add your medical history to help your doctor provide better
                care.
              </p>
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Medical History
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {/* Preferred Doctor */}
          <Card className="border-border bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                Preferred Doctor
              </CardTitle>
            </CardHeader>
            <CardContent>
              {preferredDoctorId !== "NONE" ? (
                <p className="text-sm text-foreground">
                  {doctors.find((doctor) => doctor.id === preferredDoctorId)
                    ?.name || "Selected doctor"}
                </p>
              ) : (
                <p className="text-muted-foreground text-sm italic">
                  No preferred doctor selected
                </p>
              )}
            </CardContent>
          </Card>
          {/* Medical Conditions */}
          <Card className="border-border bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Medical Conditions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {conditions.length > 0 ? (
                <ul className="space-y-1">
                  {conditions.map((condition, index) => (
                    <li
                      key={index}
                      className="text-sm text-foreground flex items-center gap-2"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                      {condition}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm italic">
                  No conditions recorded
                </p>
              )}
            </CardContent>
          </Card>

          {/* Allergies */}
          <Card className="border-border bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Allergies
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allergies.length > 0 ? (
                <ul className="space-y-1">
                  {allergies.map((allergy, index) => (
                    <li
                      key={index}
                      className="text-sm text-foreground flex items-center gap-2"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                      {allergy}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm italic">
                  No allergies recorded
                </p>
              )}
            </CardContent>
          </Card>

          {/* Current Medications */}
          <Card className="border-border bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Pill className="h-5 w-5 text-primary" />
                Current Medications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentMedications.length > 0 ? (
                <ul className="space-y-1">
                  {currentMedications.map((medication, index) => (
                    <li
                      key={index}
                      className="text-sm text-foreground flex items-center gap-2"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                      {medication}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm italic">
                  No medications recorded
                </p>
              )}
            </CardContent>
          </Card>

          {/* Past Surgeries */}
          <Card className="border-border bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                Past Surgeries
              </CardTitle>
            </CardHeader>
            <CardContent>
              {surgeries.length > 0 ? (
                <ul className="space-y-1">
                  {surgeries.map((surgery, index) => (
                    <li
                      key={index}
                      className="text-sm text-foreground flex items-center gap-2"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                      {surgery}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm italic">
                  No surgeries recorded
                </p>
              )}
            </CardContent>
          </Card>

          {/* Family History */}
          <Card className="border-border bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Family Medical History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {familyHistory ? (
                <p className="text-sm text-foreground">{familyHistory}</p>
              ) : (
                <p className="text-muted-foreground text-sm italic">
                  No family history recorded
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
