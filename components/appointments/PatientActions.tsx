"use client";

import { useState } from "react";
import { XCircle, Loader2, Eye, IndianRupee, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Appointment } from "./types";
import { JoinMeetingButton } from "./JoinMeetingButton";
import { PrescriptionWithheldBanner } from "./PrescriptionWithheldBanner";
import { DepositPaymentDialog } from "./DepositPaymentDialog";

interface PatientActionsProps {
  appointment: Appointment;
  actionLoading: { id: string; action: string } | null;
  onCancel: (appointment: Appointment) => void;
  onViewDetails: (appointment: Appointment) => void;
  doctorName?: string;
  doctorUpiId?: string;
  doctorUpiQrCode?: string | null;
}

export function PatientActions({
  appointment,
  actionLoading,
  onCancel,
  onViewDetails,
  doctorName = "Doctor",
  doctorUpiId = "",
  doctorUpiQrCode,
}: PatientActionsProps) {
  const [showDepositDialog, setShowDepositDialog] = useState(false);

  const canShowDepositPayment =
    appointment.isVideoConsultation &&
    !appointment.depositPaid &&
    !appointment.depositConfirmedAt &&
    Boolean(appointment.depositAmount) &&
    Boolean(doctorUpiId);

  const awaitingDepositVerification =
    appointment.isVideoConsultation &&
    !appointment.depositPaid &&
    Boolean(appointment.depositConfirmedAt);

  // SCHEDULED appointments
  if (appointment.status === "SCHEDULED") {
    return (
      <div className="space-y-3">
        {canShowDepositPayment && appointment.depositAmount && (
          <>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm text-amber-800">
                Deposit required to access video call:{" "}
                <strong className="inline-flex items-center">
                  <IndianRupee className="h-3 w-3 mr-0.5" />
                  {appointment.depositAmount.toLocaleString("en-IN")}
                </strong>
              </p>
              <Button
                size="sm"
                className="mt-2 bg-amber-600 hover:bg-amber-700"
                onClick={() => setShowDepositDialog(true)}
              >
                Pay Deposit
              </Button>
            </div>

            <DepositPaymentDialog
              open={showDepositDialog}
              onClose={() => setShowDepositDialog(false)}
              appointmentId={appointment.id}
              depositAmount={appointment.depositAmount}
              doctorUpiId={doctorUpiId}
              doctorUpiQrCode={doctorUpiQrCode || undefined}
              doctorName={doctorName}
            />
          </>
        )}

        {awaitingDepositVerification && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="inline-flex items-center text-sm text-blue-800">
              <Clock className="h-3.5 w-3.5 mr-1.5" />
              Deposit submitted. Waiting for doctor verification.
            </p>
          </div>
        )}

        {/* Join Meeting Button for video consultations after deposit verification */}
        {appointment.isVideoConsultation && appointment.depositPaid && (
          <div className="border-t pt-3">
            <JoinMeetingButton
              appointmentId={appointment.id}
              appointmentDate={new Date(appointment.appointmentDate)}
              appointmentTime={appointment.appointmentTime}
              meetingUrl={appointment.videoMeetingUrl}
              depositPaid={appointment.depositPaid || false}
            />
          </div>
        )}

        {/* Cancel button */}
        <div className="flex items-center gap-2 border-t pt-3">
          <Button
            size="sm"
            variant="destructive"
            className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
            onClick={() => onCancel(appointment)}
            disabled={actionLoading?.id === appointment.id}
          >
            {actionLoading?.id === appointment.id ? (
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1" />
            ) : (
              <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            )}
            Cancel Appointment
          </Button>
        </div>
      </div>
    );
  }

  // COMPLETED appointments
  if (appointment.status === "COMPLETED") {
    return (
      <div className="space-y-3">
        {/* Prescription withheld banner for video consultations */}
        {appointment.isVideoConsultation &&
          appointment.prescriptionWithheld &&
          appointment.remainingAmount &&
          doctorUpiId && (
            <div className="pt-2 mt-2">
              <PrescriptionWithheldBanner
                appointmentId={appointment.id}
                remainingAmount={appointment.remainingAmount}
                doctorUpiId={doctorUpiId}
                doctorUpiQrCode={doctorUpiQrCode}
                doctorName={doctorName}
              />
            </div>
          )}

        {/* View Details button */}
        <div className="flex items-center gap-2 border-t pt-3">
          <Button
            size="sm"
            variant="outline"
            className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
            onClick={() => onViewDetails(appointment)}
          >
            <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            <span className="hidden sm:inline">
              View Details & Prescription
            </span>
            <span className="sm:hidden">View Details</span>
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
