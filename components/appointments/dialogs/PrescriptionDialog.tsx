"use client";

import {
  Calendar,
  Check,
  CheckCircle,
  FileIcon,
  Loader2,
  Pill,
  Plus,
  Trash,
} from "lucide-react";
import { AIMedicationSuggestions } from "@/components/ai-medication-suggestions";
import { Button } from "@/components/ui/button";
import { Calendar as DatePicker } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Appointment, Medication } from "../types";

interface PrescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAppointment: Appointment | null;
  diagnosis: string;
  onDiagnosisChange: (value: string) => void;
  followUpSelectedDate: Date | undefined;
  isFollowUpOpen: boolean;
  onFollowUpOpenChange: (open: boolean) => void;
  onFollowUpDateSelect: (date: Date) => void;
  prescriptionNotes: string;
  onPrescriptionNotesChange: (value: string) => void;
  medications: Medication[];
  onAddMedication: () => void;
  onRemoveMedication: (index: number) => void;
  onUpdateMedication: (index: number, field: keyof Medication, value: string) => void;
  onAddMedicationFromAI: (medication: Medication) => void;
  selectedFile: File | null;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  actionLoading: { id: string; action: string } | null;
  isUploading: boolean;
  followUpDate: string;
  onCancel: () => void;
  onComplete: () => void;
}

export function PrescriptionDialog({
  open,
  onOpenChange,
  selectedAppointment,
  diagnosis,
  onDiagnosisChange,
  followUpSelectedDate,
  isFollowUpOpen,
  onFollowUpOpenChange,
  onFollowUpDateSelect,
  prescriptionNotes,
  onPrescriptionNotesChange,
  medications,
  onAddMedication,
  onRemoveMedication,
  onUpdateMedication,
  onAddMedicationFromAI,
  selectedFile,
  onFileSelect,
  actionLoading,
  isUploading,
  followUpDate,
  onCancel,
  onComplete,
}: PrescriptionDialogProps) {
  const isDoneDisabled =
    !diagnosis.trim() ||
    !prescriptionNotes.trim() ||
    !followUpDate ||
    medications.length === 0 ||
    medications.some(
      (med) =>
        !med.medicineName.trim() ||
        !med.dosage.trim() ||
        !med.frequency.trim() ||
        !med.duration.trim(),
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{ backgroundColor: "white" }}
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>Write Prescription</DialogTitle>
          <DialogDescription>
            Enter diagnosis, medications and notes. Click &quot;Done&quot; when
            finished to complete the appointment and record payment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Diagnosis <span className="text-red-500">*</span>
              </label>
              <Input
                value={diagnosis}
                onChange={(e) => onDiagnosisChange(e.target.value)}
                placeholder="e.g., Viral Fever"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Follow-up Date <span className="text-red-500">*</span>
              </label>
              <Popover
                open={isFollowUpOpen}
                onOpenChange={onFollowUpOpenChange}
                modal={true}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {followUpSelectedDate ? (
                      followUpSelectedDate.toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    ) : (
                      <span className="text-muted-foreground">Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0 z-10002" sideOffset={6}>
                  <DatePicker
                    mode="single"
                    selected={followUpSelectedDate}
                    onSelect={(date) => date && onFollowUpDateSelect(date)}
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Clinical Notes <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={prescriptionNotes}
              onChange={(e) => onPrescriptionNotesChange(e.target.value)}
              placeholder="Detailed clinical notes..."
              rows={3}
            />
          </div>

          <div className="border-t pt-4" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center gap-2">
                <Pill className="h-4 w-4" /> Medications{" "}
                <span className="text-red-500">*</span>
              </h4>
              <Button variant="outline" size="sm" onClick={onAddMedication}>
                <Plus className="h-3 w-3 mr-1" /> Add Medicine
              </Button>
            </div>

            {medications.length === 0 ? (
              <div className="text-center py-4 bg-red-50 rounded-lg text-sm text-red-600 border border-dashed border-red-300">
                At least one medication is required. Click &quot;Add Medicine&quot; to prescribe.
              </div>
            ) : (
              <div className="space-y-4">
                {medications.map((med, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">
                        Medicine #{index + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                        onClick={() => onRemoveMedication(index)}
                      >
                        <Trash className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          Medicine Name *
                        </label>
                        <Input
                          placeholder="e.g., Paracetamol, Amoxicillin"
                          value={med.medicineName}
                          onChange={(e) =>
                            onUpdateMedication(index, "medicineName", e.target.value)
                          }
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          Dosage *
                        </label>
                        <Input
                          placeholder="e.g., 500mg, 10ml"
                          value={med.dosage}
                          onChange={(e) => onUpdateMedication(index, "dosage", e.target.value)}
                          className="h-10"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          Frequency *
                        </label>
                        <Input
                          placeholder="e.g., Once daily, Twice daily, Every 8 hours"
                          value={med.frequency}
                          onChange={(e) =>
                            onUpdateMedication(index, "frequency", e.target.value)
                          }
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          Duration *
                        </label>
                        <Input
                          placeholder="e.g., 5 days, 2 weeks, 1 month"
                          value={med.duration}
                          onChange={(e) => onUpdateMedication(index, "duration", e.target.value)}
                          className="h-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Special Instructions (Optional)
                      </label>
                      <Input
                        placeholder="e.g., Take after meals, Avoid dairy products, Take with warm water"
                        value={med.instructions || ""}
                        onChange={(e) =>
                          onUpdateMedication(index, "instructions", e.target.value)
                        }
                        className="h-10"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedAppointment && (
            <AIMedicationSuggestions
              appointmentId={selectedAppointment.id}
              diagnosis={diagnosis}
              existingMedications={medications}
              onAddMedication={onAddMedicationFromAI}
            />
          )}

          <div className="border-t pt-4" />

          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <FileIcon className="h-4 w-4" /> Attachments (X-Ray, Report, etc.)
            </h4>
            <div className="flex items-center gap-3">
              <Input type="file" onChange={onFileSelect} className="max-w-xs" />
              {selectedFile && (
                <span className="text-sm text-green-600 flex items-center">
                  <Check className="h-3 w-3 mr-1" /> {selectedFile.name}
                </span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {isDoneDisabled && (
            <p className="text-xs text-red-500 mr-auto">
              Please fill all required fields (*) to enable Done button
            </p>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              onClick={onComplete}
              disabled={
                (selectedAppointment && actionLoading?.id === selectedAppointment.id) ||
                isUploading ||
                isDoneDisabled
              }
              className="bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {(selectedAppointment && actionLoading?.id === selectedAppointment.id) || isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-1" />
              )}
              Done
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
