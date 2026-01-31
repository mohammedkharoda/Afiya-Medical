"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Heart,
  AlertCircle,
  Pill,
  FileText,
  Clock,
  Activity,
  TrendingUp,
  CheckCircle,
  XCircle,
  Loader2,
  Stethoscope,
  HeartPulse,
  Syringe,
  ClipboardList,
  CalendarCheck,
  BriefcaseMedical,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PatientDetails {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    image?: string;
  };
  profile: {
    dob: string;
    gender: string;
    bloodGroup?: string;
    address: string;
    emergencyContact: string;
  };
  medicalHistory: {
    conditions: string[];
    allergies: string[];
    currentMedications: string[];
    surgeries: string[];
    familyHistory?: string;
  } | null;
  appointments: {
    id: string;
    appointmentDate: string;
    appointmentTime: string;
    status: string;
    symptoms: string;
    notes?: string;
    prescription?: {
      id: string;
      diagnosis: string;
      notes?: string;
      followUpDate?: string;
      medications: {
        medicineName: string;
        dosage: string;
        frequency: string;
        duration: string;
        instructions?: string;
      }[];
    };
    payment?: {
      amount: number;
      status: string;
    };
  }[];
  lastCheckup: string | null;
  stats: {
    totalAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    totalPrescriptions: number;
  };
}

export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [patient, setPatient] = useState<PatientDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatientDetails = async () => {
      try {
        const response = await fetch(`/api/patients/${resolvedParams.id}`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setPatient(data.patient);
        } else if (response.status === 403) {
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Error fetching patient details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientDetails();
  }, [resolvedParams.id, router]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-blue-100 text-blue-700";
      case "COMPLETED":
        return "bg-green-100 text-green-700";
      case "CANCELLED":
        return "bg-red-100 text-red-700";
      case "RESCHEDULED":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="mx-auto max-w-6xl">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Patient not found</p>
            <Button onClick={() => router.back()} className="mt-4">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedAppointments = patient.appointments.filter(
    (a) => a.status === "COMPLETED",
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-9 w-9"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-heading text-2xl font-bold">Patient Details</h1>
          <p className="text-sm text-muted-foreground">
            Comprehensive medical record and history
          </p>
        </div>
      </div>

      {/* Patient Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <Avatar className="h-24 w-24">
              {patient.user.image ? (
                <AvatarImage src={patient.user.image} />
              ) : null}
              <AvatarFallback className="text-black border-black border-2 text-2xl font-semibold">
                {getInitials(patient.user.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4">
              <div>
                <h2 className="font-heading text-2xl font-bold">
                  {patient.user.name}
                </h2>
                <p className="text-muted-foreground">
                  {calculateAge(patient.profile.dob)} years •{" "}
                  {patient.profile.gender}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-center gap-2.5 text-sm">
                  <Mail className="h-4 w-4 text-gray-500 shrink-0" />
                  <span className="text-gray-700">{patient.user.email}</span>
                </div>
                {patient.user.phone && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <Phone className="h-4 w-4 text-gray-500 shrink-0" />
                    <span className="text-gray-700">{patient.user.phone}</span>
                  </div>
                )}
                {patient.profile.bloodGroup && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <BriefcaseMedical className="h-4 w-4 text-gray-500 shrink-0" />
                    <span className="text-gray-700">
                      Blood Group: {patient.profile.bloodGroup}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2.5 text-sm">
                  <Calendar className="h-4 w-4 text-gray-500 shrink-0" />
                  <span className="text-gray-700">
                    DOB: {formatDate(patient.profile.dob)}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <MapPin className="h-4 w-4 text-gray-500 shrink-0" />
                  <span className="truncate text-gray-700">
                    {patient.profile.address}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <Phone className="h-4 w-4 text-gray-500 shrink-0" />
                  <span className="text-gray-700">
                    Emergency: {patient.profile.emergencyContact}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CalendarCheck className="h-10 w-10 text-black" />
              <div>
                <p className="text-2xl font-bold">
                  {patient.stats.totalAppointments}
                </p>
                <p className="text-xs text-muted-foreground">
                  Total Appointments
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-10 w-10 text-black" />
              <div>
                <p className="text-2xl font-bold">
                  {patient.stats.completedAppointments}
                </p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileText className="h-10 w-10 text-black" />
              <div>
                <p className="text-2xl font-bold">
                  {patient.stats.totalPrescriptions}
                </p>
                <p className="text-xs text-muted-foreground">Prescriptions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-10 w-10 text-black" />
              <div>
                <p className="text-sm font-semibold">
                  {patient.lastCheckup
                    ? formatDate(patient.lastCheckup)
                    : "No visits"}
                </p>
                <p className="text-xs text-muted-foreground">Last Checkup</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="history" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-primary p-1">
          <TabsTrigger
            value="history"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-medium"
          >
            Medical History
          </TabsTrigger>
          <TabsTrigger
            value="appointments"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-medium"
          >
            Appointments & Prescriptions
          </TabsTrigger>
          <TabsTrigger
            value="prescriptions"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-medium"
          >
            All Prescriptions
          </TabsTrigger>
        </TabsList>

        {/* Medical History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HeartPulse className="h-5 w-5 text-primary" />
                Medical History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {patient.medicalHistory ? (
                <>
                  {/* Conditions */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Stethoscope className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold">Medical Conditions</h3>
                    </div>
                    {patient.medicalHistory.conditions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {patient.medicalHistory.conditions.map(
                          (condition, i) => (
                            <Badge key={i} variant="outline">
                              {condition}
                            </Badge>
                          ),
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No conditions recorded
                      </p>
                    )}
                  </div>

                  <Separator />

                  {/* Allergies */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <h3 className="font-semibold">Allergies</h3>
                    </div>
                    {patient.medicalHistory.allergies.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {patient.medicalHistory.allergies.map((allergy, i) => (
                          <Badge
                            key={i}
                            variant="destructive"
                            className="bg-red-100 text-red-700"
                          >
                            {allergy}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No known allergies
                      </p>
                    )}
                  </div>

                  <Separator />

                  {/* Current Medications */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Pill className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold">Current Medications</h3>
                    </div>
                    {patient.medicalHistory.currentMedications.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {patient.medicalHistory.currentMedications.map(
                          (med, i) => (
                            <Badge key={i} variant="secondary">
                              {med}
                            </Badge>
                          ),
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No current medications
                      </p>
                    )}
                  </div>

                  <Separator />

                  {/* Surgeries */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Syringe className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold">Past Surgeries</h3>
                    </div>
                    {patient.medicalHistory.surgeries.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1">
                        {patient.medicalHistory.surgeries.map((surgery, i) => (
                          <li key={i} className="text-sm">
                            {surgery}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No surgeries recorded
                      </p>
                    )}
                  </div>

                  {patient.medicalHistory.familyHistory && (
                    <>
                      <Separator />
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-semibold">Family History</h3>
                        </div>
                        <p className="text-sm">
                          {patient.medicalHistory.familyHistory}
                        </p>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="mx-auto h-12 w-12 mb-3 opacity-50" />
                  <p>No medical history available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-4">
          {completedAppointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CalendarCheck className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-3" />
                <p className="text-muted-foreground">
                  No completed appointments yet
                </p>
              </CardContent>
            </Card>
          ) : (
            completedAppointments.map((appointment) => (
              <Card key={appointment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        {formatDate(appointment.appointmentDate)} at{" "}
                        {appointment.appointmentTime}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        <span className="font-medium">Symptoms:</span>{" "}
                        {appointment.symptoms}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(appointment.status)}>
                      {appointment.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {appointment.prescription ? (
                    <>
                      {/* Diagnosis */}
                      <div className="rounded-lg bg-muted/50 p-4">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Activity className="h-4 w-4 text-primary" />
                          Diagnosis
                        </h4>
                        <p className="text-sm">
                          {appointment.prescription.diagnosis}
                        </p>
                        {appointment.prescription.notes && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Notes: {appointment.prescription.notes}
                          </p>
                        )}
                      </div>

                      {/* Medications */}
                      {appointment.prescription.medications.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Pill className="h-4 w-4 text-primary" />
                            Prescribed Medications
                          </h4>
                          <div className="rounded-lg border overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-muted/50">
                                <tr>
                                  <th className="py-2 px-3 text-left font-medium">
                                    Medicine
                                  </th>
                                  <th className="py-2 px-3 text-left font-medium">
                                    Dosage
                                  </th>
                                  <th className="py-2 px-3 text-left font-medium">
                                    Frequency
                                  </th>
                                  <th className="py-2 px-3 text-left font-medium">
                                    Duration
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {appointment.prescription.medications.map(
                                  (med, idx) => (
                                    <tr key={idx} className="bg-white">
                                      <td className="py-2 px-3 font-medium">
                                        {med.medicineName}
                                      </td>
                                      <td className="py-2 px-3">
                                        {med.dosage}
                                      </td>
                                      <td className="py-2 px-3">
                                        {med.frequency}
                                      </td>
                                      <td className="py-2 px-3">
                                        {med.duration}
                                      </td>
                                    </tr>
                                  ),
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Payment */}
                      {appointment.payment && (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                          <span className="text-sm font-medium text-green-800">
                            Payment Status
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-green-900">
                              ₹{appointment.payment.amount}
                            </span>
                            <Badge className="bg-green-100 text-green-800">
                              {appointment.payment.status}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No prescription details available
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* All Prescriptions Tab */}
        <TabsContent value="prescriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                All Prescriptions Given
              </CardTitle>
              <CardDescription>
                Complete history of prescriptions you&apos;ve provided
              </CardDescription>
            </CardHeader>
            <CardContent>
              {patient.stats.totalPrescriptions === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 mb-3 opacity-50" />
                  <p>No prescriptions given yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {completedAppointments
                    .filter((a) => a.prescription)
                    .map((appointment, idx) => (
                      <div
                        key={appointment.id}
                        className="rounded-lg border p-4 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">
                              {appointment.prescription?.diagnosis}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(appointment.appointmentDate)} •{" "}
                              {appointment.prescription?.medications.length}{" "}
                              medication(s)
                            </p>
                          </div>
                          <Badge variant="outline">#{idx + 1}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {appointment.prescription?.medications.map(
                            (med, i) => (
                              <Badge
                                key={i}
                                variant="secondary"
                                className="text-xs"
                              >
                                {med.medicineName}
                              </Badge>
                            ),
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
