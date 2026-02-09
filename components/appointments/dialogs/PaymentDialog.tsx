"use client";

import { Banknote, Check, CheckCircle, Copy, Loader2, Send, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DoctorProfile, UserData } from "../types";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentStep: "invoice" | "confirm";
  paymentAmount: string;
  onPaymentAmountChange: (value: string) => void;
  doctorProfile: DoctorProfile | null;
  userData: UserData | null;
  copiedUPI: boolean;
  onCopyUPI: (upiId: string) => void;
  sendingInvoice: boolean;
  onSendInvoice: () => void;
  onConfirmPayment: (received: boolean) => void;
  patientName: string;
}

export function PaymentDialog({
  open,
  onOpenChange,
  paymentStep,
  paymentAmount,
  onPaymentAmountChange,
  doctorProfile,
  userData,
  copiedUPI,
  onCopyUPI,
  sendingInvoice,
  onSendInvoice,
  onConfirmPayment,
  patientName,
}: PaymentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{ backgroundColor: "white" }}
        className="w-[92vw] sm:max-w-lg max-h-[90vh] overflow-hidden rounded-2xl border border-slate-200/80 p-0 shadow-2xl flex flex-col"
      >
        {paymentStep === "invoice" ? (
          <>
            <div className="px-6 pt-6 pb-5 border-b border-slate-200/70 bg-gradient-to-br from-blue-50 via-white to-emerald-50">
              <DialogHeader className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center ring-1 ring-blue-200/60 shadow-sm">
                    <Send className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-semibold tracking-tight text-slate-900">
                      Send Invoice
                    </DialogTitle>
                    <DialogDescription className="text-sm mt-1 text-slate-600">
                      Enter the consultation fee and share payment details with the patient.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
            </div>

            <div className="px-6 pb-4 pt-5 space-y-5 flex-1 overflow-y-auto">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Consultation Fee
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">
                    {"\u20B9"}
                  </span>
                  <Input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => onPaymentAmountChange(e.target.value)}
                    className="h-12 rounded-xl border-2 border-slate-200 bg-white/80 pl-8 text-xl font-semibold text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="Enter the Fee Amount"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  This amount will appear on the patient&apos;s invoice.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center ring-1 ring-blue-200/60">
                      <span className="text-blue-700 font-bold text-sm">
                        {"\u20B9"}
                      </span>
                    </div>
                    <span className="font-semibold text-slate-900">
                      UPI Payment Details
                    </span>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    Instant
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      UPI ID
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700">
                        {doctorProfile?.upiId || "Not configured"}
                      </span>
                      {doctorProfile?.upiId && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-slate-100"
                          onClick={() => onCopyUPI(doctorProfile.upiId)}
                        >
                          {copiedUPI ? (
                            <Check className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Copy className="h-4 w-4 text-slate-500" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Name
                    </span>
                    <span className="font-medium text-slate-900">
                      Dr. {userData?.name || "Unknown"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-t border-slate-200 shrink-0">
              <Button
                onClick={onSendInvoice}
                disabled={sendingInvoice || !paymentAmount || parseFloat(paymentAmount) <= 0}
                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
              >
                {sendingInvoice ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending Invoice...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Invoice to Patient
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-slate-500 mt-2">
                Invoice will be sent via email with payment details
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="relative overflow-hidden border-b border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-white to-blue-50 px-6 pb-5 pt-6">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-200/30 blur-2xl" />
              <div className="absolute -left-8 top-10 h-24 w-24 rounded-full bg-blue-200/30 blur-2xl" />
              <DialogHeader className="relative z-10 space-y-3">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center ring-1 ring-emerald-200/70 shadow-sm">
                    <Banknote className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-semibold tracking-tight text-slate-900">
                      Confirm Payment
                    </DialogTitle>
                    <DialogDescription className="text-sm mt-1 text-slate-600">
                      Invoice sent! Has the patient made the payment?
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
            </div>

            <div className="px-6 pb-4 pt-5 space-y-5 flex-1 overflow-y-auto">
              <div className="rounded-2xl border border-emerald-200/60 bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Patient
                  </span>
                  <span className="font-semibold text-slate-900 text-right">
                    {patientName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Amount
                  </span>
                  <span className="text-2xl sm:text-3xl font-bold text-slate-900">
                    {"\u20B9"}
                    {paymentAmount}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 sm:p-5 flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="text-sm text-emerald-700">
                  Recording this payment will add{" "}
                  <span className="font-semibold">
                    {"\u20B9"}
                    {paymentAmount || 0}
                  </span>{" "}
                  to today&apos;s collection.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-t border-slate-200 shrink-0">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => onConfirmPayment(false)}
                  className="flex-1 h-11 rounded-xl font-semibold"
                >
                  Not Paid
                </Button>
                <Button
                  onClick={() => onConfirmPayment(true)}
                  className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Paid
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
