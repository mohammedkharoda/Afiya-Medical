"use client";

import { CheckCircle, FileIcon, Pill, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Appointment } from "../types";

interface ViewPrescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAppointment: Appointment | null;
  onClose: () => void;
}

export function ViewPrescriptionDialog({
  open,
  onOpenChange,
  selectedAppointment,
  onClose,
}: ViewPrescriptionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-4xl max-h-[90vh] overflow-hidden p-0 rounded-2xl border-border/80 shadow-2xl"
      >
        <div className="border-b border-border/80 bg-gradient-to-r from-emerald-50 via-white to-teal-50 p-6">
          <DialogHeader className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-xl">
                  Prescription & Bill Details
                </DialogTitle>
                <DialogDescription className="text-sm">
                  View your diagnosis, medications, and billing information.
                </DialogDescription>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Summary
                </span>
                <DialogClose
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-700 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </DialogClose>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 pb-6 pt-4">
          {selectedAppointment && (
            <div className="space-y-6">
              {selectedAppointment.payment &&
                selectedAppointment.payment.status === "PAID" && (
                  <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-green-800 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" /> Paid Bill
                        </h4>
                        <p className="text-sm text-green-700">
                          Amount Paid:{" "}
                          <span className="font-bold text-lg">
                            {"\u20B9"}
                            {selectedAppointment.payment.amount}
                          </span>
                        </p>
                      </div>
                      <Badge className="bg-green-200 text-green-800 hover:bg-green-200">
                        PAID
                      </Badge>
                    </div>
                  </div>
                )}

              {selectedAppointment.prescription ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-border/70 bg-white p-4 shadow-sm">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">
                        Diagnosis
                      </label>
                      <p className="mt-1 font-medium text-lg">
                        {selectedAppointment.prescription.diagnosis}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-white p-4 shadow-sm">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">
                        Clinical Notes
                      </label>
                      <p className="mt-1 text-sm text-foreground">
                        {selectedAppointment.prescription.notes || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Pill className="h-4 w-4 text-primary" /> Medications
                    </h4>
                    {selectedAppointment.prescription.medications.length > 0 ? (
                      <div className="rounded-xl border border-border/70 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-[720px] w-full text-sm">
                            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                              <tr>
                                <th className="py-3 px-3 text-left font-medium w-48">
                                  Medicine
                                </th>
                                <th className="py-3 px-3 text-left font-medium w-28">
                                  Dosage
                                </th>
                                <th className="py-3 px-3 text-left font-medium w-32">
                                  Freq
                                </th>
                                <th className="py-3 px-3 text-left font-medium w-28">
                                  Duration
                                </th>
                                <th className="py-3 px-3 text-left font-medium">
                                  Instructions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {selectedAppointment.prescription.medications.map(
                                (med, idx) => (
                                  <tr key={idx} className="bg-white">
                                    <td className="py-3 px-3 font-medium align-top">
                                      {med.medicineName}
                                    </td>
                                    <td className="py-3 px-3 align-top">
                                      {med.dosage}
                                    </td>
                                    <td className="py-3 px-3 align-top">
                                      {med.frequency}
                                    </td>
                                    <td className="py-3 px-3 align-top">
                                      {med.duration}
                                    </td>
                                    <td className="py-3 px-3 text-muted-foreground align-top">
                                      {med.instructions || "-"}
                                    </td>
                                  </tr>
                                ),
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        No medications prescribed.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground bg-muted/20 rounded-lg">
                  <p>Prescription details not available.</p>
                </div>
              )}

              {selectedAppointment.patient?.medicalDocuments &&
                selectedAppointment.patient.medicalDocuments.filter(
                  (doc) => doc.documentType === "PRESCRIPTION",
                ).length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <FileIcon className="h-4 w-4 text-primary" /> Prescription Documents
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedAppointment.patient.medicalDocuments
                        .filter((doc) => doc.documentType === "PRESCRIPTION")
                        .map((doc) => (
                          <a
                            key={doc.id}
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-lg border border-border/70 bg-white px-3 py-2 text-sm text-blue-600 transition-colors hover:bg-muted hover:underline"
                          >
                            <FileIcon className="h-4 w-4" />
                            {doc.fileName}
                          </a>
                        ))}
                    </div>
                  </div>
                )}
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button onClick={onClose} className="min-w-28">
              Close
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
