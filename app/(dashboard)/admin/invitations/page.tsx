"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Clock,
  FileText,
  FlaskConical,
  Loader2,
  Mail,
  RefreshCw,
  Send,
  ShieldCheck,
  Trash2,
  User,
  UserPlus,
  XCircle,
} from "lucide-react";

interface Invitation {
  id: string;
  email: string;
  name: string | null;
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
  expiresAt: string;
  createdAt: string;
  acceptedAt: string | null;
  isTestAccount: boolean;
}

interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
  speciality: string;
  degrees: string[];
  experience: number | null;
  isTestAccount: boolean;
  isVerified: boolean;
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED" | null;
  verificationReviewedAt: string | null;
}

interface VerificationRequest {
  id: string;
  userId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  registrationNumber: string;
  registrationCertificateUrl: string;
  registrationCertificateName: string;
  aadhaarCardUrl: string;
  aadhaarCardName: string;
  panCardUrl: string;
  panCardName: string;
  reviewNotes: string | null;
  reviewedAt: string | null;
  submittedAt: string;
  createdAt: string;
  doctorName: string;
  doctorEmail: string;
  doctorPhone: string | null;
  doctorIsActive: boolean;
  speciality: string;
  degrees: string[];
  experience: number | null;
  clinicAddress: string | null;
  isTestAccount: boolean;
}

interface VerificationSummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

const invitationStatusConfig = {
  PENDING: {
    label: "Pending",
    icon: Clock,
    className: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  },
  ACCEPTED: {
    label: "Accepted",
    icon: CheckCircle2,
    className: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  },
  EXPIRED: {
    label: "Expired",
    icon: AlertCircle,
    className: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  },
  REVOKED: {
    label: "Revoked",
    icon: Ban,
    className: "bg-rose-100 text-rose-800 hover:bg-rose-100",
  },
};

const verificationStatusConfig = {
  PENDING: {
    label: "Pending review",
    className: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  },
  APPROVED: {
    label: "Approved",
    className: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-rose-100 text-rose-800 hover:bg-rose-100",
  },
};

export default function AdminInvitationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [reviewMode, setReviewMode] = useState<"approve" | "reject">(
    "approve",
  );
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewTarget, setReviewTarget] = useState<VerificationRequest | null>(
    null,
  );
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);
  const [invitationToDelete, setInvitationToDelete] =
    useState<Invitation | null>(null);

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<
    VerificationRequest[]
  >([]);
  const [verificationSummary, setVerificationSummary] =
    useState<VerificationSummary>({
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
    });

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isTestAccount, setIsTestAccount] = useState(false);

  const fetchInvitations = useCallback(async () => {
    const response = await fetch("/api/admin/invitations", {
      cache: "no-store",
      credentials: "include",
    });

    if (response.status === 401) {
      router.push("/admin/login");
      return;
    }

    if (response.status === 403) {
      toast.error("You don't have permission to access this page");
      router.push("/dashboard");
      return;
    }

    const data = await response.json();
    setInvitations(data.invitations || []);
  }, [router]);

  const fetchDoctors = useCallback(async () => {
    const response = await fetch("/api/admin/doctors", {
      cache: "no-store",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch doctors");
    }

    const data = await response.json();
    setDoctors(data.doctors || []);
  }, []);

  const fetchVerificationRequests = useCallback(async () => {
    const response = await fetch("/api/admin/doctor-verifications", {
      cache: "no-store",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch doctor verifications");
    }

    const data = await response.json();
    setVerificationRequests(data.requests || []);
    setVerificationSummary(
      data.summary || {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
      },
    );
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchInvitations(),
        fetchDoctors(),
        fetchVerificationRequests(),
      ]);
    } catch {
      toast.error("Failed to load doctor admin data");
    } finally {
      setLoading(false);
    }
  }, [fetchDoctors, fetchInvitations, fetchVerificationRequests]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const approvedDoctors = useMemo(
    () => doctors.filter((doctor) => doctor.isVerified),
    [doctors],
  );
  const todaysInvitationCount = useMemo(() => {
    const now = new Date();

    return invitations.filter((invitation) => {
      const createdAt = new Date(invitation.createdAt);

      return (
        createdAt.getFullYear() === now.getFullYear() &&
        createdAt.getMonth() === now.getMonth() &&
        createdAt.getDate() === now.getDate()
      );
    }).length;
  }, [invitations]);

  const sortedVerificationRequests = useMemo(() => {
    const weight = {
      PENDING: 0,
      REJECTED: 1,
      APPROVED: 2,
    };

    return [...verificationRequests].sort((a, b) => {
      if (weight[a.status] !== weight[b.status]) {
        return weight[a.status] - weight[b.status];
      }

      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
  }, [verificationRequests]);

  useEffect(() => {
    if (todaysInvitationCount <= 0 || typeof window === "undefined") {
      return;
    }

    const todayKey = new Date().toISOString().slice(0, 10);
    const storageKey = `admin-invite-toast-${todayKey}`;
    const previousCount = Number(window.sessionStorage.getItem(storageKey) || "0");

    if (todaysInvitationCount > previousCount) {
      toast.success(
        `You got ${todaysInvitationCount} invite${todaysInvitationCount === 1 ? "" : "s"} today`,
      );
      window.sessionStorage.setItem(storageKey, String(todaysInvitationCount));
    }
  }, [todaysInvitationCount]);

  const handleSendInvitation = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);

    try {
      const response = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: name || undefined,
          isTestAccount,
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to send invitation");
        return;
      }

      toast.success("Invitation sent successfully");
      setDialogOpen(false);
      setEmail("");
      setName("");
      setIsTestAccount(false);
      fetchInvitations();
    } catch {
      toast.error("An error occurred while sending the invitation");
    } finally {
      setSending(false);
    }
  };

  const handleResend = async (invitationId: string) => {
    setActionLoading(invitationId);

    try {
      const response = await fetch("/api/admin/invitations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId, action: "resend" }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to resend invitation");
        return;
      }

      toast.success("Invitation resent successfully");
      fetchInvitations();
    } catch {
      toast.error("An error occurred while resending the invitation");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async (invitationId: string) => {
    setActionLoading(invitationId);

    try {
      const response = await fetch("/api/admin/invitations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId, action: "revoke" }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to revoke invitation");
        return;
      }

      toast.success("Invitation revoked");
      fetchInvitations();
    } catch {
      toast.error("An error occurred while revoking the invitation");
    } finally {
      setActionLoading(null);
    }
  };

  const openReviewDialog = (
    target: VerificationRequest,
    mode: "approve" | "reject",
  ) => {
    setReviewTarget(target);
    setReviewMode(mode);
    setReviewNotes(mode === "approve" ? target.reviewNotes || "" : "");
    setReviewDialogOpen(true);
  };

  const handleReview = async () => {
    if (!reviewTarget) return;

    if (reviewMode === "reject" && !reviewNotes.trim()) {
      toast.error("Please add a reason before rejecting this doctor");
      return;
    }

    setReviewing(true);

    try {
      const response = await fetch("/api/admin/doctor-verifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationId: reviewTarget.id,
          action: reviewMode,
          reviewNotes,
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to update doctor verification");
        return;
      }

      toast.success(
        reviewMode === "approve"
          ? "Doctor approved successfully"
          : "Doctor rejected successfully",
      );
      setReviewDialogOpen(false);
      setReviewTarget(null);
      setReviewNotes("");
      fetchData();
    } catch {
      toast.error("An error occurred while updating verification");
    } finally {
      setReviewing(false);
    }
  };

  const handleDeleteDoctor = async () => {
    if (!doctorToDelete && !invitationToDelete) return;

    setDeleting(true);

    try {
      const url = invitationToDelete
        ? `/api/admin/doctors?email=${encodeURIComponent(invitationToDelete.email)}`
        : `/api/admin/doctors?id=${doctorToDelete!.id}`;

      const response = await fetch(url, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to delete doctor");
        return;
      }

      toast.success("Doctor deleted successfully");
      const deletedDoctorId =
        typeof data.deletedDoctorId === "string" ? data.deletedDoctorId : null;
      const deletedInvitationIds = Array.isArray(data.deletedInvitationIds)
        ? (data.deletedInvitationIds as string[])
        : [];
      const deletedEmail =
        typeof data.deletedEmail === "string"
          ? data.deletedEmail.toLowerCase()
          : null;

      if (deletedDoctorId) {
        setDoctors((current) =>
          current.filter((doctor) => doctor.id !== deletedDoctorId),
        );
        setVerificationRequests((current) => {
          const next = current.filter(
            (request) => request.userId !== deletedDoctorId,
          );

          setVerificationSummary({
            total: next.length,
            pending: next.filter((item) => item.status === "PENDING").length,
            approved: next.filter((item) => item.status === "APPROVED").length,
            rejected: next.filter((item) => item.status === "REJECTED").length,
          });

          return next;
        });
      }

      if (deletedInvitationIds.length > 0 || deletedEmail) {
        setInvitations((current) =>
          current.filter((invitation) => {
            if (deletedInvitationIds.includes(invitation.id)) {
              return false;
            }

            if (
              deletedEmail &&
              invitation.email.toLowerCase() === deletedEmail
            ) {
              return false;
            }

            return true;
          }),
        );
      }

      setDeleteDialogOpen(false);
      setDoctorToDelete(null);
      setInvitationToDelete(null);
      await fetchData();
    } catch {
      toast.error("An error occurred while deleting the doctor");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-border bg-[linear-gradient(135deg,rgba(24,39,75,0.98),rgba(45,116,113,0.94)_58%,rgba(155,125,69,0.9))] text-white shadow-[0_28px_80px_-42px_rgba(15,23,42,0.65)]">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
          <div className="space-y-4">
            <Badge className="w-fit bg-white/12 text-white hover:bg-white/12">
              Admin workspace
            </Badge>
            <div>
              <h1 className="text-3xl font-heading font-bold tracking-tight">
                Doctor Review Dashboard
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-white/78 sm:text-base">
                Review doctor verification documents, manage invitations, and
                keep the approved care team clean and current.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              className="border-white/30 bg-white/10 text-white hover:bg-white/16 hover:text-white"
              onClick={fetchData}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white text-slate-900 hover:bg-white/92">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Doctor
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite a Doctor</DialogTitle>
                  <DialogDescription>
                    Send an invitation email so a doctor can start their
                    registration and upload verification documents.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSendInvitation}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="invite-email">Email Address</Label>
                      <Input
                        id="invite-email"
                        type="email"
                        placeholder="doctor@example.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        disabled={sending}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invite-name">
                        Doctor&apos;s Name (Optional)
                      </Label>
                      <Input
                        id="invite-name"
                        type="text"
                        placeholder="Dr. John Doe"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        disabled={sending}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="test-account"
                        checked={isTestAccount}
                        onCheckedChange={(checked) =>
                          setIsTestAccount(checked === true)
                        }
                        disabled={sending}
                      />
                      <Label
                        htmlFor="test-account"
                        className="flex items-center gap-2 text-sm font-medium"
                      >
                        <FlaskConical className="h-4 w-4 text-orange-500" />
                        Mark as test account
                      </Label>
                    </div>
                    <p className="pl-6 text-xs text-muted-foreground">
                      Test accounts remain visible for internal QA and training.
                    </p>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      disabled={sending}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={sending || !email}>
                      {sending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Invitation
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Pending Reviews",
            value: verificationSummary.pending,
            helper: "Doctor profiles waiting for admin approval",
            icon: Clock,
          },
          {
            label: "Approved Doctors",
            value: approvedDoctors.length,
            helper: "Active doctors who can log in and take patients",
            icon: CheckCircle2,
          },
          {
            label: "Rejected Reviews",
            value: verificationSummary.rejected,
            helper: "Profiles that still need corrected documents",
            icon: XCircle,
          },
          {
            label: "Open Invitations",
            value: invitations.filter((item) => item.status === "PENDING").length,
            helper: "Invites sent but not completed yet",
            icon: Mail,
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.label} className="border-border">
              <CardContent className="flex items-start justify-between gap-4 p-5">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">
                    {item.value}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {item.helper}
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="verifications" className="space-y-5">
        <TabsList className="grid h-auto w-full grid-cols-1 gap-2 rounded-[26px] border border-slate-200 bg-[linear-gradient(135deg,rgba(255,248,235,0.95),rgba(242,247,250,0.95))] p-2 shadow-[0_22px_44px_-34px_rgba(15,23,42,0.45)] sm:grid-cols-3">
          <TabsTrigger
            value="verifications"
            className="rounded-2xl border border-transparent bg-white/70 px-4 py-3 text-sm font-semibold text-slate-600 transition-all data-[state=active]:border-slate-900 data-[state=active]:bg-slate-950 data-[state=active]:text-white data-[state=active]:shadow-[0_16px_34px_-24px_rgba(15,23,42,0.75)]"
          >
            Verification Queue
          </TabsTrigger>
          <TabsTrigger
            value="invitations"
            className="rounded-2xl border border-transparent bg-white/70 px-4 py-3 text-sm font-semibold text-slate-600 transition-all data-[state=active]:border-slate-900 data-[state=active]:bg-slate-950 data-[state=active]:text-white data-[state=active]:shadow-[0_16px_34px_-24px_rgba(15,23,42,0.75)]"
          >
            Invitations
          </TabsTrigger>
          <TabsTrigger
            value="doctors"
            className="rounded-2xl border border-transparent bg-white/70 px-4 py-3 text-sm font-semibold text-slate-600 transition-all data-[state=active]:border-slate-900 data-[state=active]:bg-slate-950 data-[state=active]:text-white data-[state=active]:shadow-[0_16px_34px_-24px_rgba(15,23,42,0.75)]"
          >
            Approved Doctors
          </TabsTrigger>
        </TabsList>

        <TabsContent value="verifications" className="space-y-4">
          {sortedVerificationRequests.length === 0 ? (
            <Card>
              <CardContent className="py-14 text-center">
                <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">
                  No doctor verification requests yet
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Doctors will appear here after they complete registration and
                  upload their documents.
                </p>
              </CardContent>
            </Card>
          ) : (
            sortedVerificationRequests.map((request) => (
              <Card key={request.id} className="border-border">
                <CardContent className="space-y-5 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-semibold text-foreground">
                          Dr. {request.doctorName}
                        </h3>
                        <Badge
                          className={
                            verificationStatusConfig[request.status].className
                          }
                        >
                          {verificationStatusConfig[request.status].label}
                        </Badge>
                        {request.isTestAccount ? (
                          <Badge
                            variant="outline"
                            className="border-orange-300 bg-orange-50 text-orange-700"
                          >
                            Test account
                          </Badge>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                        <span>{request.doctorEmail}</span>
                        <span>{request.doctorPhone || "No phone added"}</span>
                        <span>
                          Submitted{" "}
                          {format(new Date(request.submittedAt), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        variant="outline"
                        onClick={() => openReviewDialog(request, "reject")}
                        disabled={reviewing}
                      >
                        Reject
                      </Button>
                      <Button
                        onClick={() => openReviewDialog(request, "approve")}
                        disabled={reviewing}
                      >
                        Approve
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                    <div className="rounded-2xl border border-border bg-card/60 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Professional Snapshot
                      </p>
                      <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                        <p>
                          <span className="font-medium text-foreground">
                            Speciality:
                          </span>{" "}
                          {request.speciality}
                        </p>
                        <p>
                          <span className="font-medium text-foreground">
                            Registration No:
                          </span>{" "}
                          {request.registrationNumber}
                        </p>
                        <p>
                          <span className="font-medium text-foreground">
                            Degrees:
                          </span>{" "}
                          {request.degrees.join(", ") || "Not provided"}
                        </p>
                        <p>
                          <span className="font-medium text-foreground">
                            Experience:
                          </span>{" "}
                          {request.experience !== null
                            ? `${request.experience} years`
                            : "Not provided"}
                        </p>
                        <p>
                          <span className="font-medium text-foreground">
                            Clinic:
                          </span>{" "}
                          {request.clinicAddress || "Not provided"}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card/60 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Submitted Documents
                      </p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        {[
                          {
                            label: "Certificate",
                            url: request.registrationCertificateUrl,
                            name: request.registrationCertificateName,
                          },
                          {
                            label: "Aadhaar",
                            url: request.aadhaarCardUrl,
                            name: request.aadhaarCardName,
                          },
                          {
                            label: "PAN",
                            url: request.panCardUrl,
                            name: request.panCardName,
                          },
                        ].map((document) => (
                          <a
                            key={document.label}
                            href={document.url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl border border-border bg-background p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
                          >
                            <FileText className="h-4 w-4 text-primary" />
                            <p className="mt-2 text-sm font-medium text-foreground">
                              {document.label}
                            </p>
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                              {document.name}
                            </p>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>

                  {request.reviewNotes ? (
                    <div className="rounded-2xl border border-border bg-muted/40 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Latest Review Notes
                      </p>
                      <p className="mt-2 text-sm text-foreground">
                        {request.reviewNotes}
                      </p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          {invitations.length === 0 ? (
            <Card>
              <CardContent className="py-14 text-center">
                <Mail className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">No invitations yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Invite a doctor to start the registration and verification
                  flow.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {invitations.map((invitation) => {
                const status = invitationStatusConfig[invitation.status];
                const StatusIcon = status.icon;

                return (
                  <Card key={invitation.id} className="border-border">
                    <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-foreground">
                            {invitation.email}
                          </p>
                          <Badge className={status.className}>
                            <StatusIcon className="mr-1 h-3.5 w-3.5" />
                            {status.label}
                          </Badge>
                          {invitation.isTestAccount ? (
                            <Badge
                              variant="outline"
                              className="border-orange-300 bg-orange-50 text-orange-700"
                            >
                              Test account
                            </Badge>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                          <span>{invitation.name || "No pre-filled name"}</span>
                          <span>
                            Invited{" "}
                            {format(
                              new Date(invitation.createdAt),
                              "MMM d, yyyy",
                            )}
                          </span>
                          <span>
                            {invitation.status === "ACCEPTED"
                              ? `Accepted ${format(new Date(invitation.acceptedAt!), "MMM d, yyyy")}`
                              : `Expires ${format(new Date(invitation.expiresAt), "MMM d, yyyy")}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {invitation.status === "PENDING" ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResend(invitation.id)}
                              disabled={actionLoading === invitation.id}
                            >
                              {actionLoading === invitation.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="mr-2 h-4 w-4" />
                              )}
                              Resend
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleRevoke(invitation.id)}
                              disabled={actionLoading === invitation.id}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Revoke
                            </Button>
                          </>
                        ) : null}

                        {invitation.status === "ACCEPTED" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              setInvitationToDelete(invitation);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Doctor
                          </Button>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="doctors" className="space-y-4">
          {approvedDoctors.length === 0 ? (
            <Card>
              <CardContent className="py-14 text-center">
                <User className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">
                  No approved doctors yet
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Approved doctor accounts will appear here once you review their
                  documents.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {approvedDoctors.map((doctor) => (
                <Card key={doctor.id} className="border-border">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-foreground">
                            Dr. {doctor.name}
                          </h3>
                          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                            Approved
                          </Badge>
                          {doctor.isTestAccount ? (
                            <Badge
                              variant="outline"
                              className="border-orange-300 bg-orange-50 text-orange-700"
                            >
                              Test account
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {doctor.email}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setDoctorToDelete(doctor);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid gap-3 rounded-2xl border border-border bg-card/60 p-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Speciality
                        </p>
                        <p className="mt-1 font-medium text-foreground">
                          {doctor.speciality}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Joined
                        </p>
                        <p className="mt-1 font-medium text-foreground">
                          {format(new Date(doctor.createdAt), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Experience
                        </p>
                        <p className="mt-1 font-medium text-foreground">
                          {doctor.experience !== null
                            ? `${doctor.experience} years`
                            : "Not provided"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Phone
                        </p>
                        <p className="mt-1 font-medium text-foreground">
                          {doctor.phone || "Not provided"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Degrees
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {doctor.degrees.map((degree) => (
                          <Badge key={degree} variant="secondary">
                            {degree}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={reviewDialogOpen}
        onOpenChange={(open) => {
          setReviewDialogOpen(open);
          if (!open) {
            setReviewTarget(null);
            setReviewNotes("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewMode === "approve" ? "Approve Doctor" : "Reject Doctor"}
            </DialogTitle>
            <DialogDescription>
              {reviewTarget
                ? `${reviewMode === "approve" ? "Approve" : "Reject"} Dr. ${reviewTarget.doctorName} after reviewing the submitted documents.`
                : "Review the selected doctor profile."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {reviewTarget ? (
              <div className="rounded-2xl border border-border bg-card/60 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  {reviewTarget.doctorEmail}
                </p>
                <p className="mt-1">
                  {reviewTarget.speciality} • Registration No.{" "}
                  {reviewTarget.registrationNumber}
                </p>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="review-notes">
                {reviewMode === "approve"
                  ? "Approval Notes (Optional)"
                  : "Rejection Reason"}
              </Label>
              <Textarea
                id="review-notes"
                placeholder={
                  reviewMode === "approve"
                    ? "Add any internal notes for this approval"
                    : "Explain what needs to be corrected before approval"
                }
                value={reviewNotes}
                onChange={(event) => setReviewNotes(event.target.value)}
                rows={5}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
              disabled={reviewing}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleReview}
              disabled={reviewing}
              variant={reviewMode === "approve" ? "default" : "destructive"}
            >
              {reviewing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : reviewMode === "approve" ? (
                "Approve Doctor"
              ) : (
                "Reject Doctor"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setDoctorToDelete(null);
            setInvitationToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Doctor</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>
                  Are you sure you want to delete{" "}
                  <strong>
                    Dr.{" "}
                    {doctorToDelete?.name ||
                      invitationToDelete?.name ||
                      invitationToDelete?.email}
                  </strong>
                  ? This action cannot be undone.
                </p>
                <p className="mt-3">This will also:</p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                  <li>Remove the doctor account and profile</li>
                  <li>Cancel their pending appointments</li>
                  <li>Delete their saved schedule</li>
                  <li>Clear preferred doctor links from patients</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDoctor}
              disabled={deleting}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Doctor"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
