"use client";

import { Video, Info } from "lucide-react";
import { Label } from "@/components/ui/label";

interface VideoConsultationToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function VideoConsultationToggle({
  enabled,
  onChange,
}: VideoConsultationToggleProps) {
  const toggle = () => onChange(!enabled);

  return (
    <div
      role="switch"
      aria-checked={enabled}
      aria-label="Video consultation"
      tabIndex={0}
      onClick={toggle}
      onKeyDown={(event) => {
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          toggle();
        }
      }}
      className={`cursor-pointer rounded-xl border p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
        enabled
          ? "border-emerald-200 bg-emerald-50/70"
          : "border-border bg-card hover:bg-muted/40"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
              enabled ? "bg-primary/20 ring-1 ring-primary/30" : "bg-primary/10"
            }`}
          >
            <Video
              className={`h-5 w-5 transition-colors ${
                enabled ? "text-primary" : "text-muted-foreground"
              }`}
            />
          </div>
          <div className="flex-1">
            <Label className="font-medium cursor-pointer">Video Consultation</Label>
            <p className="text-sm text-muted-foreground">
              Join remotely via video call
            </p>
            {enabled && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1 text-amber-600">
                  <Info className="h-3 w-3" />
                  <span className="font-medium">
                    Doctor will set your video consultation fee after approval
                  </span>
                </div>
              </div>
            )}
            {enabled && (
              <div className="mt-1 text-xs text-muted-foreground">
                You will pay 50% after doctor approval, and 50% after
                consultation to unlock prescription
              </div>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
          <span
            className={`text-xs font-semibold ${
              enabled ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {enabled ? "Enabled" : "Off"}
          </span>
          <div
            aria-hidden="true"
            className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-all duration-200 ease-out ${
              enabled
                ? "border-emerald-600 bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.25)]"
                : "border-zinc-300 bg-zinc-200"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full shadow transition-transform duration-200 ease-out ${
                enabled ? "bg-white" : "bg-zinc-50"
              } ${
                enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
