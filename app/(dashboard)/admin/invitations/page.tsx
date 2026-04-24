"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import { PageSpinner } from "@/components/ui/spinner";
import { InviteDialog } from "./_components/InviteDialog";
import { ReviewDialog } from "./_components/ReviewDialog";
import { DeleteDoctorDialog } from "./_components/DeleteDoctorDialog";
import { useAdminData } from "./_components/useAdminData";
import type { Doctor, Invitation, VerificationRequest } from "./_components/types";

const invitationStatusConfig = {
  PENDING: { label: "Pending", icon: Clock, className: "bg-amber-100 text-amber-800 hover:bg-amber-100" },
  ACCEPTED: { label: "Accepted", icon: CheckCircle2, className: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" },
  EXPIRED: { label: "Expired", icon: AlertCircle, className: "bg-slate-100 text-slate-700 hover:bg-slate-100" },
  REVOKED: { label: "Revoked", icon: Ban, className: "bg-rose-100 text-rose-800 hover:bg-rose-100" },
};

const verificationStatusConfig = {
  PENDING: { label: "Pending review", className: "bg-amber-100 text-amber-800 hover:bg-amber-100" },
  APPROVED: { label: "Approved", className: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" },
  REJECTED: { label: "Rejected", className: "bg-rose-100 text-rose-800 hover:bg-rose-100" },
};

export default function AdminInvitationsPage() {
  const {
    loading,
    invitations,
    approvedDoctors,
    verificationRequests,
    verificationSummary,
    fetchAll,
    fetchInvitations,
    removeDoctor,
  } = useAdminData();

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<VerificationRequest | null>(null);
  const [reviewMode, setReviewMode] = useState<"approve" | "reject">("approve");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);
  const [invitationToDelete, setInvitationToDelete] = useState<Invitation | null>(null);

  const todaysInvitationCount = useMemo(() => {
    const now = new Date();
    return invitations.filter((inv) => {
      const d = new Date(inv.createdAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    }).length;
  }, [invitations]);

  useEffect(() => {
    if (todaysInvitationCount <= 0 || typeof window === "undefined") return;
    const key = `admin-invite-toast-${new Date().toISOString().slice(0, 10)}`;
    const prev = Number(window.sessionStorage.getItem(key) || "0");
    if (todaysInvitationCount > prev) {
      toast.success(`You got ${todaysInvitationCount} invite${todaysInvitationCount === 1 ? "" : "s"} today`);
      window.sessionStorage.setItem(key, String(todaysInvitationCount));
    }
  }, [todaysInvitationCount]);

  const handleInvitationAction = async (invitationId: string, action: "resend" | "revoke") => {
    setActionLoading(invitationId);
    try {
      const res = await fetch("/api/admin/invitations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId, action }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || `Failed to ${action} invitation`); return; }
      toast.success(action === "resend" ? "Invitation resent successfully" : "Invitation revoked");
      fetchInvitations();
    } catch {
      toast.error(`An error occurred while ${action === "resend" ? "resending" : "revoking"} the invitation`);
    } finally {
      setActionLoading(null);
    }
  };

  const openReview = (target: VerificationRequest, mode: "approve" | "reject") => {
    setReviewTarget(target);
    setReviewMode(mode);
    setReviewOpen(true);
  };

  const openDelete = (doctor?: Doctor, invitation?: Invitation) => {
    setDoctorToDelete(doctor ?? null);
    setInvitationToDelete(invitation ?? null);
    setDeleteOpen(true);
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <Card className="overflow-hidden border-border bg-[linear-gradient(135deg,rgba(24,39,75,0.98),rgba(45,116,113,0.94)_58%,rgba(155,125,69,0.9))] text-white shadow-[0_28px_80px_-42px_rgba(15,23,42,0.65)]">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
          <div className="space-y-4">
            <Badge className="w-fit bg-white/12 text-white hover:bg-white/12">Admin workspace</Badge>
            <div>
              <h1 className="text-3xl font-heading font-bold tracking-tight">Doctor Review Dashboard</h1>
              <p className="mt-2 max-w-2xl text-sm text-white/78 sm:text-base">
                Review doctor verification documents, manage invitations, and keep the approved care team clean and current.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              className="border-white/30 bg-white/10 text-white hover:bg-white/16 hover:text-white"
              onClick={fetchAll}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <InviteDialog onInvited={fetchInvitations} />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Pending Reviews", value: verificationSummary.pending, helper: "Doctor profiles waiting for admin approval", icon: Clock },
          { label: "Approved Doctors", value: approvedDoctors.length, helper: "Active doctors who can log in and take patients", icon: CheckCircle2 },
          { label: "Rejected Reviews", value: verificationSummary.rejected, helper: "Profiles that still need corrected documents", icon: XCircle },
          { label: "Open Invitations", value: invitations.filter((i) => i.status === "PENDING").length, helper: "Invites sent but not completed yet", icon: Mail },
        ].map(({ label, value, helper, icon: Icon }) => (
          <Card key={label} className="border-border">
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
                <p className="mt-2 text-xs text-muted-foreground">{helper}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="verifications" className="space-y-5">
        <TabsList className="grid h-auto w-full grid-cols-1 gap-2 rounded-[26px] border border-slate-200 bg-[linear-gradient(135deg,rgba(255,248,235,0.95),rgba(242,247,250,0.95))] p-2 shadow-[0_22px_44px_-34px_rgba(15,23,42,0.45)] sm:grid-cols-3">
          {["verifications", "invitations", "doctors"].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="rounded-2xl border border-transparent bg-white/70 px-4 py-3 text-sm font-semibold text-slate-600 transition-all data-[state=active]:border-slate-900 data-[state=active]:bg-slate-950 data-[state=active]:text-white data-[state=active]:shadow-[0_16px_34px_-24px_rgba(15,23,42,0.75)]"
            >
              {tab === "verifications" ? "Verification Queue" : tab === "invitations" ? "Invitations" : "Approved Doctors"}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Verification queue */}
        <TabsContent value="verifications" className="space-y-4">
          {verificationRequests.length === 0 ? (
            <Card>
              <CardContent className="py-14 text-center">
                <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">No doctor verification requests yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Doctors will appear here after they complete registration and upload their documents.
                </p>
              </CardContent>
            </Card>
          ) : (
            verificationRequests.map((request) => (
              <Card key={request.id} className="border-border">
                <CardContent className="space-y-5 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-semibold text-foreground">Dr. {request.doctorName}</h3>
                        <Badge className={verificationStatusConfig[request.status].className}>
                          {verificationStatusConfig[request.status].label}
                        </Badge>
                        {request.isTestAccount ? (
                          <Badge variant="outline" className="border-orange-300 bg-orange-50 text-orange-700">
                            Test account
                          </Badge>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                        <span>{request.doctorEmail}</span>
                        <span>{request.doctorPhone || "No phone added"}</span>
                        <span>Submitted {format(new Date(request.submittedAt), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button variant="outline" onClick={() => openReview(request, "reject")}>Reject</Button>
                      <Button onClick={() => openReview(request, "approve")}>Approve</Button>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                    <div className="rounded-2xl border border-border bg-card/60 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Professional Snapshot</p>
                      <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                        {[
                          ["Speciality", request.speciality],
                          ["Registration No", request.registrationNumber],
                          ["Degrees", request.degrees.join(", ") || "Not provided"],
                          ["Experience", request.experience !== null ? `${request.experience} years` : "Not provided"],
                          ["Clinic", request.clinicAddress || "Not provided"],
                        ].map(([label, value]) => (
                          <p key={label}>
                            <span className="font-medium text-foreground">{label}:</span> {value}
                          </p>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card/60 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Submitted Documents</p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        {[
                          { label: "Certificate", url: request.registrationCertificateUrl, name: request.registrationCertificateName },
                          { label: "Aadhaar", url: request.aadhaarCardUrl, name: request.aadhaarCardName },
                          { label: "PAN", url: request.panCardUrl, name: request.panCardName },
                        ].map((doc) => (
                          <a key={doc.label} href={doc.url} target="_blank" rel="noreferrer"
                            className="rounded-xl border border-border bg-background p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
                          >
                            <FileText className="h-4 w-4 text-primary" />
                            <p className="mt-2 text-sm font-medium text-foreground">{doc.label}</p>
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{doc.name}</p>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>

                  {request.reviewNotes ? (
                    <div className="rounded-2xl border border-border bg-muted/40 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Latest Review Notes</p>
                      <p className="mt-2 text-sm text-foreground">{request.reviewNotes}</p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Invitations */}
        <TabsContent value="invitations" className="space-y-4">
          {invitations.length === 0 ? (
            <Card>
              <CardContent className="py-14 text-center">
                <Mail className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">No invitations yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Invite a doctor to start the registration and verification flow.
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
                          <p className="font-medium text-foreground">{invitation.email}</p>
                          <Badge className={status.className}>
                            <StatusIcon className="mr-1 h-3.5 w-3.5" />
                            {status.label}
                          </Badge>
                          {invitation.isTestAccount ? (
                            <Badge variant="outline" className="border-orange-300 bg-orange-50 text-orange-700">
                              Test account
                            </Badge>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                          <span>{invitation.name || "No pre-filled name"}</span>
                          <span>Invited {format(new Date(invitation.createdAt), "MMM d, yyyy")}</span>
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
                              variant="outline" size="sm"
                              onClick={() => handleInvitationAction(invitation.id, "resend")}
                              disabled={actionLoading === invitation.id}
                            >
                              {actionLoading === invitation.id
                                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                : <RefreshCw className="mr-2 h-4 w-4" />}
                              Resend
                            </Button>
                            <Button
                              variant="outline" size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleInvitationAction(invitation.id, "revoke")}
                              disabled={actionLoading === invitation.id}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Revoke
                            </Button>
                          </>
                        ) : null}
                        {invitation.status === "ACCEPTED" ? (
                          <Button
                            variant="outline" size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => openDelete(undefined, invitation)}
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

        {/* Approved doctors */}
        <TabsContent value="doctors" className="space-y-4">
          {approvedDoctors.length === 0 ? (
            <Card>
              <CardContent className="py-14 text-center">
                <User className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">No approved doctors yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Approved doctor accounts will appear here once you review their documents.
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
                          <h3 className="text-lg font-semibold text-foreground">Dr. {doctor.name}</h3>
                          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Approved</Badge>
                          {doctor.isTestAccount ? (
                            <Badge variant="outline" className="border-orange-300 bg-orange-50 text-orange-700">
                              Test account
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{doctor.email}</p>
                      </div>
                      <Button
                        variant="outline" size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => openDelete(doctor)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid gap-3 rounded-2xl border border-border bg-card/60 p-4 sm:grid-cols-2">
                      {[
                        ["Speciality", doctor.speciality],
                        ["Joined", format(new Date(doctor.createdAt), "MMM d, yyyy")],
                        ["Experience", doctor.experience !== null ? `${doctor.experience} years` : "Not provided"],
                        ["Phone", doctor.phone || "Not provided"],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
                          <p className="mt-1 font-medium text-foreground">{value}</p>
                        </div>
                      ))}
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Degrees</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {doctor.degrees.map((degree) => (
                          <Badge key={degree} variant="secondary">{degree}</Badge>
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

      <ReviewDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        target={reviewTarget}
        mode={reviewMode}
        onReviewed={fetchAll}
      />

      <DeleteDoctorDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) { setDoctorToDelete(null); setInvitationToDelete(null); }
        }}
        doctor={doctorToDelete}
        invitation={invitationToDelete}
        onDeleted={({ deletedDoctorId, deletedInvitationIds, deletedEmail }) => {
          removeDoctor(deletedDoctorId, deletedInvitationIds, deletedEmail);
          fetchAll();
        }}
      />
    </div>
  );
}
