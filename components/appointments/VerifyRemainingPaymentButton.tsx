"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, Eye, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface VerifyRemainingPaymentButtonProps {
  appointmentId: string;
  paymentScreenshot?: string | null;
  onVerified?: () => void;
}

export function VerifyRemainingPaymentButton({
  appointmentId,
  paymentScreenshot,
  onVerified,
}: VerifyRemainingPaymentButtonProps) {
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/remaining/verify`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to verify payment");
      }

      toast.success("Remaining payment verified! Prescription released to patient.");

      // Call onVerified callback or refresh page
      if (onVerified) {
        onVerified();
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error("Error verifying remaining payment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to verify payment");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="flex gap-2">
      {paymentScreenshot && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(paymentScreenshot, "_blank")}
        >
          <Eye className="h-4 w-4 mr-2" />
          View Proof
          <ExternalLink className="h-3 w-3 ml-1" />
        </Button>
      )}
      <Button
        size="sm"
        onClick={handleVerify}
        disabled={verifying}
        className="bg-green-600 hover:bg-green-700"
      >
        {verifying ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Releasing...
          </>
        ) : (
          <>
            <CheckCircle className="h-4 w-4 mr-2" />
            Verify & Release Prescription
          </>
        )}
      </Button>
    </div>
  );
}
