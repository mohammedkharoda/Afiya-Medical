"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, Eye, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface VerifyDepositButtonProps {
  appointmentId: string;
  paymentScreenshot?: string | null;
  onVerified?: () => void;
}

export function VerifyDepositButton({
  appointmentId,
  paymentScreenshot,
  onVerified,
}: VerifyDepositButtonProps) {
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const response = await fetch(
        `/api/appointments/${appointmentId}/deposit/verify`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to verify payment");
      }

      toast.success("Deposit payment verified successfully");

      // Call onVerified callback or refresh page
      if (onVerified) {
        onVerified();
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error("Error verifying deposit:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to verify payment",
      );
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
        className="bg-amber-300 hover:bg-amber-500"
      >
        {verifying ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Verifying...
          </>
        ) : (
          <>
            <CheckCircle className="h-4 w-4 mr-2" />
            Verify Deposit
          </>
        )}
      </Button>
    </div>
  );
}
