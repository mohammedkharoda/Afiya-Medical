"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  IndianRupee,
  Copy,
  Upload,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface DepositPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  appointmentId: string;
  depositAmount: number;
  doctorUpiId: string;
  doctorUpiQrCode?: string;
  doctorName: string;
  paymentType?: "deposit" | "remaining"; // Type of payment (default: deposit)
}

export function DepositPaymentDialog({
  open,
  onClose,
  appointmentId,
  depositAmount,
  doctorUpiId,
  doctorUpiQrCode,
  doctorName,
  paymentType = "deposit",
}: DepositPaymentDialogProps) {
  const [paymentScreenshot, setPaymentScreenshot] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const copyUpiId = () => {
    navigator.clipboard.writeText(doctorUpiId);
    toast.success("UPI ID copied to clipboard");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default",
      );

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setPaymentScreenshot(data.secure_url);
      toast.success("Screenshot uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload screenshot");
    } finally {
      setUploading(false);
    }
  };

  const confirmPayment = async () => {
    setConfirming(true);
    try {
      const endpoint =
        paymentType === "remaining"
          ? `/api/appointments/${appointmentId}/remaining/confirm`
          : `/api/appointments/${appointmentId}/deposit/confirm`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentScreenshot }),
      });

      if (!response.ok) {
        throw new Error("Failed to confirm payment");
      }

      const successMessage =
        paymentType === "remaining"
          ? "Payment confirmed. Doctor will verify and release your prescription."
          : "Payment confirmation submitted. Doctor will verify within 24 hours.";

      toast.success(successMessage);
      onClose();

      // Refresh the page to show updated appointment status
      window.location.reload();
    } catch (error) {
      console.error("Confirmation error:", error);
      toast.error("Failed to confirm payment");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {paymentType === "remaining" ? "Pay Remaining Fee" : "Pay Deposit"}{" "}
            to Dr. {doctorName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Amount */}
          <div className="rounded-lg bg-primary/10 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              {paymentType === "remaining"
                ? "Remaining Amount (50%)"
                : "Deposit Amount (50%)"}
            </p>
            <div className="mt-1 flex items-center justify-center gap-1 text-3xl font-bold text-primary">
              <IndianRupee className="h-6 w-6" />
              {depositAmount.toLocaleString("en-IN")}
            </div>
          </div>

          {/* UPI ID */}
          <div>
            <p className="text-sm font-medium mb-2">Pay to UPI ID:</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-lg border border-border bg-muted px-4 py-3 font-mono text-sm">
                {doctorUpiId}
              </div>
              <Button variant="outline" size="icon" onClick={copyUpiId}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* QR Code */}
          {doctorUpiQrCode && (
            <div>
              <p className="text-sm font-medium mb-2">Or scan QR code:</p>
              <div className="flex justify-center">
                <div className="relative w-48 h-48 border border-border rounded-lg overflow-hidden">
                  <Image
                    src={doctorUpiQrCode}
                    alt="UPI QR Code"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Upload proof */}
          <div>
            <p className="text-sm font-medium mb-2">
              Upload payment screenshot (optional):
            </p>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted p-4 hover:bg-accent transition-colors">
              <Upload className="h-5 w-5" />
              <span className="text-sm">
                {uploading ? "Uploading..." : "Choose file"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
            {paymentScreenshot && (
              <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                Screenshot uploaded
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                After making payment, click &quot;I&apos;ve Paid&quot; below.
                Doctor will verify your payment within 24 hours. If not
                verified, appointment will be auto-cancelled.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={confirming}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmPayment}
              disabled={confirming || uploading}
              className="flex-1 bg-green-400 hover:bg-green-500"
            >
              {confirming ? "Submitting..." : "I've Paid"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
