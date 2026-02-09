import { useState } from "react";
import { Medication } from "@/components/appointments/types";

export function usePrescriptionForm() {
  const [diagnosis, setDiagnosis] = useState("");
  const [prescriptionNotes, setPrescriptionNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [medications, setMedications] = useState<Medication[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);

  const addMedication = () => {
    setMedications([
      ...medications,
      {
        medicineName: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
      },
    ]);
  };

  const removeMedication = (index: number) => {
    const newMeds = [...medications];
    newMeds.splice(index, 1);
    setMedications(newMeds);
  };

  const updateMedication = (
    index: number,
    field: keyof Medication,
    value: string,
  ) => {
    const newMeds = [...medications];
    newMeds[index] = { ...newMeds[index], [field]: value };
    setMedications(newMeds);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const resetForm = () => {
    setDiagnosis("");
    setPrescriptionNotes("");
    setFollowUpDate("");
    setMedications([]);
    setSelectedFile(null);
    setIsFollowUpOpen(false);
  };

  return {
    diagnosis,
    setDiagnosis,
    prescriptionNotes,
    setPrescriptionNotes,
    followUpDate,
    setFollowUpDate,
    medications,
    setMedications,
    selectedFile,
    setSelectedFile,
    isUploading,
    setIsUploading,
    isFollowUpOpen,
    setIsFollowUpOpen,
    addMedication,
    removeMedication,
    updateMedication,
    handleFileSelect,
    resetForm,
  };
}
