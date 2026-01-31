"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CreditCard,
  Calendar,
  CheckCircle,
  Clock,
  IndianRupee,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/lib/auth-client";

interface Appointment {
  id: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  paymentStatus: string;
  symptoms?: string;
  patient?: {
    user?: {
      name?: string;
    };
  };
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  paymentMethod: string;
  paidAt: string | null;
  createdAt: string;
  appointment?: Appointment;
}

// Standard consultation fee - could be fetched from settings later
const CONSULTATION_FEE = 500;

export default function PaymentsPage() {
  const { data: session } = useSession();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      // Fetch both payments and appointments in parallel
      const [paymentsRes, appointmentsRes] = await Promise.all([
        fetch("/api/payments", { credentials: "include" }),
        fetch("/api/appointments", { credentials: "include" }),
      ]);

      const paymentsData = await paymentsRes.json();
      const appointmentsData = await appointmentsRes.json();

      if (paymentsRes.ok) {
        setPayments(paymentsData.payments || []);
      }
      if (appointmentsRes.ok) {
        setAppointments(appointmentsData.appointments || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isDoctor =
    (session?.user as any)?.role === "DOCTOR" ||
    (session?.user as any)?.role === "ADMIN";

  // Calculate payment summary
  const totalPaid = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0);

  // Pending appointments (scheduled and not cancelled, payment not yet paid)
  const pendingAppointments = appointments.filter(
    (a) => a.status === "SCHEDULED" && a.paymentStatus === "PENDING",
  );

  // Note: Only relevant for doctor view if we decide to show it
  const pendingAmount = pendingAppointments.length * CONSULTATION_FEE;

  // Completed appointments count
  const completedAppointments = appointments.filter(
    (a) => a.status === "COMPLETED",
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-700";
      case "PENDING":
        return "bg-amber-100 text-amber-700";
      case "FAILED":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Total Paid / Earnings Card */}
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-600">
                  {isDoctor ? "Total Earnings" : "Total Paid"}
                </p>
                <p className="text-2xl font-bold text-green-700">
                  ₹{totalPaid.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Doctor-Only: Pending Payment & Consultation Fee (Optional, hidden for now based on user request to simplify) */}
        {/* User request: "the consult fee need to be remove" - implying generally remove it or hide it. 
            For Doctor, seeing pending might be okay, but let's stick to the prompt's focus on Earnings. 
            Let's hide the other cards for simplicity as requested, ensuring a clean interface. 
        */}
      </div>

      {/* Payment History */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-xl">
            <CreditCard className="h-5 w-5" />
            {isDoctor ? "Earnings History" : "Payment History"}
          </CardTitle>
          <CardDescription>
            {isDoctor
              ? "Track all payments received from completed appointments"
              : "View a record of your completed payments"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : payments.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <CreditCard className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">
                {isDoctor ? "No earnings yet" : "No payments recorded"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {isDoctor
                  ? "Payments will appear here once you complete appointments and record fees"
                  : "Payments will appear here after your consultation is complete"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-accent/30"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        payment.status === "PAID"
                          ? "bg-green-100"
                          : "bg-amber-100"
                      }`}
                    >
                      <CreditCard
                        className={`h-5 w-5 ${
                          payment.status === "PAID"
                            ? "text-green-600"
                            : "text-amber-600"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        ₹{payment.amount.toLocaleString("en-IN")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <Calendar className="mr-1 inline h-3 w-3" />
                        {payment.paidAt
                          ? formatDate(payment.paidAt)
                          : formatDate(payment.createdAt)}
                      </p>
                      {/* Show Patient Name for Doctor */}
                      {isDoctor && payment.appointment?.patient?.user?.name && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Patient: {payment.appointment.patient.user.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(payment.status)}>
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
