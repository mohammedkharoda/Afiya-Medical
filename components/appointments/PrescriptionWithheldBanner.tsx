"use client";

import { useState } from "react";
import { AlertCircle, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DepositPaymentDialog } from "./DepositPaymentDialog";

interface PrescriptionWithheldBannerProps {
  appointmentId: string;
  remainingAmount: number;
  doctorUpiId: string;
  doctorUpiQrCode?: string | null;
  doctorName: string;
}

export function PrescriptionWithheldBanner({
  appointmentId,
  remainingAmount,
  doctorUpiId,
  doctorUpiQrCode,
  doctorName,
}: PrescriptionWithheldBannerProps) {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  return (
    <>
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-amber-900">
              Prescription Ready - Payment Required
            </h4>
            <p className="text-sm text-amber-700 mt-1">
              Your prescription is ready. Please pay the remaining{" "}
              <span className="inline-flex items-center font-semibold">
                <IndianRupee className="h-3 w-3" />
                {remainingAmount.toLocaleString("en-IN")}
              </span>{" "}
              consultation fee to access it.
            </p>
          </div>
          <Button
            onClick={() => setShowPaymentDialog(true)}
            size="sm"
            className="flex-shrink-0 bg-amber-600 hover:bg-amber-700"
          >
            Pay Now
          </Button>
        </div>
      </div>

      {/* Reuse deposit payment dialog for remaining payment */}
      <DepositPaymentDialog
        open={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        appointmentId={appointmentId}
        depositAmount={remainingAmount}
        doctorUpiId={doctorUpiId}
        doctorUpiQrCode={doctorUpiQrCode || undefined}
        doctorName={doctorName}
        paymentType="remaining"
      />
    </>
  );
}
