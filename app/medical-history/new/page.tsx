"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { HeartPulse, Pill, Syringe, Users, AlertCircle } from "lucide-react";

type FormData = {
  conditions?: string;
  allergies?: string;
  currentMedications?: string;
  surgeries?: string;
  familyHistory?: string;
};

export default function MedicalHistoryNewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    // Convert comma/line separated strings to arrays for backend
    const toArray = (val?: string) =>
      val
        ?.split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean) || [];
    const payload = {
      conditions: toArray(data.conditions),
      allergies: toArray(data.allergies),
      currentMedications: toArray(data.currentMedications),
      surgeries: toArray(data.surgeries),
      familyHistory: data.familyHistory,
    };
    try {
      const res = await fetch("/api/medical-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to save medical history");
        return;
      }
      toast.success("Medical history saved successfully!");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-2xl border-border shadow-xl">
        <CardHeader className="space-y-2 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <HeartPulse size={24} className="text-primary" />
            </div>
            <CardTitle className="text-3xl font-heading text-foreground">
              Medical History
            </CardTitle>
          </div>
          <CardDescription className="text-muted-foreground text-base">
            Tell us about your medical background to help us serve you better
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-foreground font-medium flex items-center gap-2">
                <AlertCircle size={16} className="text-primary" />
                Existing Conditions
              </Label>
              <textarea
                {...register("conditions")}
                placeholder="List any chronic conditions (comma or line separated)"
                className="w-full rounded-lg border-2 border-input px-4 py-3 min-h-20 
                  focus:border-primary focus:ring-2 focus:ring-primary/20 bg-card text-foreground
                  placeholder:text-muted-foreground transition-all duration-200 resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-medium flex items-center gap-2">
                <AlertCircle size={16} className="text-destructive" />
                Allergies
              </Label>
              <textarea
                {...register("allergies")}
                placeholder="List any allergies (comma or line separated)"
                className="w-full rounded-lg border-2 border-input px-4 py-3 min-h-20 
                  focus:border-primary focus:ring-2 focus:ring-primary/20 bg-card text-foreground
                  placeholder:text-muted-foreground transition-all duration-200 resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-medium flex items-center gap-2">
                <Pill size={16} className="text-primary" />
                Current Medications
              </Label>
              <textarea
                {...register("currentMedications")}
                placeholder="List medicines you currently take (comma or line separated)"
                className="w-full rounded-lg border-2 border-input px-4 py-3 min-h-20 
                  focus:border-primary focus:ring-2 focus:ring-primary/20 bg-card text-foreground
                  placeholder:text-muted-foreground transition-all duration-200 resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-medium flex items-center gap-2">
                <Syringe size={16} className="text-primary" />
                Past Surgeries
              </Label>
              <textarea
                {...register("surgeries")}
                placeholder="Describe any past surgeries (comma or line separated)"
                className="w-full rounded-lg border-2 border-input px-4 py-3 min-h-20 
                  focus:border-primary focus:ring-2 focus:ring-primary/20 bg-card text-foreground
                  placeholder:text-muted-foreground transition-all duration-200 resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-medium flex items-center gap-2">
                <Users size={16} className="text-primary" />
                Family History
              </Label>
              <textarea
                {...register("familyHistory")}
                placeholder="Any relevant family medical history"
                className="w-full rounded-lg border-2 border-input px-4 py-3 min-h-20 
                  focus:border-primary focus:ring-2 focus:ring-primary/20 bg-card text-foreground
                  placeholder:text-muted-foreground transition-all duration-200 resize-none"
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                size="lg"
                disabled={loading}
                variant={"outline"}
                className="h-12 px-8 text-base font-semibold"
              >
                {loading ? "Saving..." : "Save and Continue"}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
