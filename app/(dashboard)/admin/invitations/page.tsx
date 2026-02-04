"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  UserPlus,
  Send,
  RefreshCw,
  XCircle,
  Loader2,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  Ban,
  FlaskConical,
  Trash2,
  Stethoscope,
  User,
} from "lucide-react";
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
import { format } from "date-fns";

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
}

const statusConfig = {
  PENDING: {
    label: "Pending",
    variant: "secondary" as const,
    icon: Clock,
    color: "text-yellow-600",
  },
  ACCEPTED: {
    label: "Accepted",
    variant: "default" as const,
    icon: CheckCircle2,
    color: "text-green-600",
  },
  EXPIRED: {
    label: "Expired",
    variant: "outline" as const,
    icon: AlertCircle,
    color: "text-gray-500",
  },
  REVOKED: {
    label: "Revoked",
    variant: "destructive" as const,
    icon: Ban,
    color: "text-red-600",
  },
};

export default function AdminInvitationsPage() {
  const router = useRouter();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);
  const [invitationToDelete, setInvitationToDelete] =
    useState<Invitation | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isTestAccount, setIsTestAccount] = useState(false);

  // Fetch invitations
  const fetchInvitations = async () => {
    try {
      const response = await fetch("/api/admin/invitations", {
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
    } catch {
      toast.error("Failed to fetch invitations");
    }
  };

  // Fetch doctors
  const fetchDoctors = async () => {
    try {
      const response = await fetch("/api/admin/doctors", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setDoctors(data.doctors || []);
      }
    } catch {
      toast.error("Failed to fetch doctors");
    }
  };

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchInvitations(), fetchDoctors()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Send invitation
  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      const response = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: name || undefined, isTestAccount }),
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
      toast.error("An error occurred");
    } finally {
      setSending(false);
    }
  };

  // Resend invitation
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
      toast.error("An error occurred");
    } finally {
      setActionLoading(null);
    }
  };

  // Revoke invitation
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
      toast.error("An error occurred");
    } finally {
      setActionLoading(null);
    }
  };

  // Delete doctor
  const handleDeleteDoctor = async () => {
    if (!doctorToDelete && !invitationToDelete) return;

    setDeleting(true);

    try {
      // If deleting from invitation, use email-based deletion
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
      setDeleteDialogOpen(false);
      setDoctorToDelete(null);
      setInvitationToDelete(null);
      // Refresh both lists
      fetchDoctors();
      fetchInvitations();
    } catch {
      toast.error("An error occurred");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">
            Doctor Invitations
          </h1>
          <p className="text-muted-foreground">
            Invite doctors to join Afiya Medical Clinic
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gray-800 hover:bg-gray-900 text-white">
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Doctor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite a Doctor</DialogTitle>
              <DialogDescription>
                Send an invitation email to a doctor. They will receive a link
                to complete their registration.
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
                    onChange={(e) => setEmail(e.target.value)}
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
                    onChange={(e) => setName(e.target.value)}
                    disabled={sending}
                  />
                  <p className="text-xs text-muted-foreground">
                    If provided, the name will be pre-filled in their
                    registration form
                  </p>
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
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                  >
                    <FlaskConical className="h-4 w-4 text-orange-500" />
                    Mark as Test Account
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  Test accounts are visible to patients but will show a warning
                  during registration.
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
                <Button
                  type="submit"
                  disabled={sending || !email}
                  className="bg-gray-800 hover:bg-gray-900 text-white"
                >
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

      <Card>
        <CardHeader>
          <CardTitle>All Invitations</CardTitle>
          <CardDescription>
            View and manage all doctor invitations
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-hidden">
          {invitations.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No invitations yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Click &quot;Invite Doctor&quot; to send your first invitation
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invited</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => {
                  const status = statusConfig[invitation.status];
                  const StatusIcon = status.icon;
                  const isActionDisabled =
                    actionLoading === invitation.id ||
                    invitation.status !== "PENDING";

                  return (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">
                        {invitation.email}
                      </TableCell>
                      <TableCell>{invitation.name || "-"}</TableCell>
                      <TableCell>
                        {invitation.isTestAccount ? (
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1 w-fit border-orange-300 bg-orange-50 text-orange-700"
                          >
                            <FlaskConical className="h-3 w-3" />
                            Test
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={status.variant}
                          className="flex items-center gap-1 w-fit"
                        >
                          <StatusIcon className={`h-3 w-3 ${status.color}`} />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(invitation.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {invitation.status === "ACCEPTED"
                          ? format(
                              new Date(invitation.acceptedAt!),
                              "MMM d, yyyy",
                            )
                          : format(
                              new Date(invitation.expiresAt),
                              "MMM d, yyyy",
                            )}
                      </TableCell>
                      <TableCell className="text-right">
                        {invitation.status === "PENDING" && (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResend(invitation.id)}
                              disabled={isActionDisabled}
                            >
                              {actionLoading === invitation.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                              <span className="sr-only">Resend</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleRevoke(invitation.id)}
                              disabled={isActionDisabled}
                            >
                              {actionLoading === invitation.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                              <span className="sr-only">Revoke</span>
                            </Button>
                          </div>
                        )}
                        {invitation.status === "ACCEPTED" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              setInvitationToDelete(invitation);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete Doctor</span>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Registered Doctors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Registered Doctors
          </CardTitle>
          <CardDescription>
            Manage doctors who have completed registration
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-hidden">
          {doctors.length === 0 ? (
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No doctors yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Doctors will appear here after they complete registration
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Speciality</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctors.map((doctor) => (
                  <TableRow key={doctor.id}>
                    <TableCell className="font-medium">
                      Dr. {doctor.name}
                    </TableCell>
                    <TableCell>{doctor.email}</TableCell>
                    <TableCell>{doctor.speciality}</TableCell>
                    <TableCell>
                      {doctor.isTestAccount ? (
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1 w-fit border-orange-300 bg-orange-50 text-orange-700"
                        >
                          <FlaskConical className="h-3 w-3" />
                          Test
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(doctor.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setDoctorToDelete(doctor);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
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
                <p className="mt-3">This will:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>Remove the doctor&apos;s account and profile</li>
                  <li>Cancel all their pending appointments</li>
                  <li>Remove their schedule</li>
                  <li>Clear preferred doctor selections from patients</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDoctor}
              disabled={deleting}
              className="bg-red-400 text-white hover:bg-destructive/90"
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
