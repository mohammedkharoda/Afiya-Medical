"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CompleteAppointmentDialogProps {
  appointmentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CompleteAppointmentDialog({
  appointmentId,
  open,
  onOpenChange,
  onSuccess,
}: CompleteAppointmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [consultationFee, setConsultationFee] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [isPaid, setIsPaid] = useState(false);
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fee = parseFloat(consultationFee);
    if (isNaN(fee) || fee <= 0) {
      toast.error("Please enter a valid consultation fee");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/appointments/${appointmentId}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            consultationFee: fee,
            paymentMethod,
            isPaid,
            notes,
          }),
          credentials: "include",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to complete appointment");
      }

      toast.success("Appointment completed successfully");
      onOpenChange(false);
      onSuccess?.();

      // Reset form
      setConsultationFee("");
      setPaymentMethod("CASH");
      setIsPaid(false);
      setNotes("");
    } catch (error: any) {
      console.error("Error completing appointment:", error);
      toast.error(error.message || "Failed to complete appointment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Complete Appointment</DialogTitle>
          <DialogDescription>
            Enter the consultation fee and payment details to complete this
            appointment.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fee">Consultation Fee (₹) *</Label>
              <Input
                id="fee"
                type="number"
                step="0.01"
                min="0"
                placeholder="500"
                value={consultationFee}
                onChange={(e) => setConsultationFee(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="UPI_MANUAL">UPI (Manual)</SelectItem>
                  <SelectItem value="UPI_QR">UPI (QR Code)</SelectItem>
                  <SelectItem value="ONLINE">Online Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPaid"
                checked={isPaid}
                onCheckedChange={(checked) => setIsPaid(checked as boolean)}
              />
              <Label
                htmlFor="isPaid"
                className="text-sm font-normal cursor-pointer"
              >
                Mark as paid now
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about payment..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete Appointment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
