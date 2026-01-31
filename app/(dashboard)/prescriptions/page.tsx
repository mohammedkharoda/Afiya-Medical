"use client";

import { useState, useEffect } from "react";
import { pdf } from "@react-pdf/renderer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Download,
  Calendar,
  User,
  Pill,
  Paperclip,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { PrescriptionPDF } from "@/components/prescription-pdf";

interface Medication {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

interface Prescription {
  id: string;
  diagnosis: string;
  notes?: string;
  createdAt: string;
  followUpDate?: string;
  doctorName?: string;
  attachmentUrl?: string;
  medications: Medication[];
  appointment?: {
    appointmentDate: string;
    patient?: {
      user?: {
        name: string;
      };
    };
  };
}

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const response = await fetch("/api/prescriptions", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          console.log("Prescriptions data:", data.prescriptions);
          setPrescriptions(data.prescriptions || []);
        }
      } catch (error) {
        console.error("Error fetching prescriptions:", error);
        toast.error("Failed to load prescriptions");
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, []);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const handleDownload = async (prescription: Prescription) => {
    setDownloadingId(prescription.id);
    try {
      // Generate PDF using @react-pdf/renderer
      const blob = await pdf(
        <PrescriptionPDF prescription={prescription} />
      ).toBlob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prescription-${prescription.id.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // If there's an attachment, also open it for download
      if (prescription.attachmentUrl) {
        window.open(prescription.attachmentUrl, "_blank");
        toast.success("Prescription PDF and attachment downloaded!");
      } else {
        toast.success("Prescription PDF downloaded!");
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading prescriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-2xl font-heading text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Prescriptions
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            View and download your medical prescriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {prescriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="bg-primary/10 p-6 rounded-full mb-4">
                <FileText className="h-12 w-12 text-primary" />
              </div>
              <p className="text-xl font-semibold text-foreground">
                No prescriptions found
              </p>
              <p className="text-muted-foreground mt-2 max-w-sm">
                Your medical prescriptions will appear here once your
                consultation is complete.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {prescriptions.map((prescription) => (
                <Card
                  key={prescription.id}
                  className="group relative overflow-hidden border-border bg-card hover:shadow-lg transition-all duration-300 flex flex-col"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />

                  <CardHeader className="pb-3 pl-6">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="text-xs font-mono">
                        {formatDate(prescription.createdAt)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => handleDownload(prescription)}
                        disabled={downloadingId === prescription.id}
                      >
                        {downloadingId === prescription.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <CardTitle
                      className="text-lg font-bold text-primary line-clamp-1"
                      title={prescription.diagnosis}
                    >
                      {prescription.diagnosis}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-3 w-3 text-primary" />
                      </div>
                      <span className="font-medium">
                        {prescription.doctorName || "Dr. N/A"}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="pl-6 pb-6 flex-1 flex flex-col gap-4">
                    {/* Medications */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <Pill className="h-3 w-3" />
                        Medications
                      </div>
                      <div className="space-y-2">
                        {prescription.medications.map((med, index) => (
                          <div
                            key={med.id || index}
                            className="bg-muted/40 p-2.5 rounded-lg border border-border/50 text-sm hover:bg-muted/60 transition-colors"
                          >
                            <div className="font-medium text-foreground flex justify-between">
                              <span>{med.medicineName}</span>
                              <span className="text-xs bg-background px-1.5 py-0.5 rounded border border-border">
                                {med.dosage}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 flex gap-2">
                              <span>{med.frequency}</span>
                              <span>•</span>
                              <span>{med.duration}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer Info */}
                    {(prescription.notes ||
                      prescription.followUpDate ||
                      prescription.attachmentUrl) && (
                      <div className="pt-4 border-t border-border mt-auto space-y-2">
                        {prescription.followUpDate && (
                          <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
                            <Calendar className="h-3 w-3" />
                            Follow up: {formatDate(prescription.followUpDate)}
                          </div>
                        )}
                        {prescription.notes && (
                          <p
                            className="text-xs text-muted-foreground italic line-clamp-2"
                            title={prescription.notes}
                          >
                            Note: {prescription.notes}
                          </p>
                        )}
                        {prescription.attachmentUrl && (
                          <a
                            href={prescription.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                          >
                            <Paperclip className="h-3 w-3" />
                            View Prescription Attachment
                          </a>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
