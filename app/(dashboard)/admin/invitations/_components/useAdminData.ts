"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Doctor, Invitation, VerificationRequest, VerificationSummary } from "./types";

const EMPTY_SUMMARY: VerificationSummary = { total: 0, pending: 0, approved: 0, rejected: 0 };

export function useAdminData() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [verificationSummary, setVerificationSummary] = useState<VerificationSummary>(EMPTY_SUMMARY);

  const fetchInvitations = useCallback(async () => {
    const res = await fetch("/api/admin/invitations", { cache: "no-store", credentials: "include" });
    if (res.status === 401) { router.push("/admin/login"); return; }
    if (res.status === 403) { toast.error("You don't have permission to access this page"); router.push("/dashboard"); return; }
    const data = await res.json();
    setInvitations(data.invitations || []);
  }, [router]);

  const fetchDoctors = useCallback(async () => {
    const res = await fetch("/api/admin/doctors", { cache: "no-store", credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch doctors");
    const data = await res.json();
    setDoctors(data.doctors || []);
  }, []);

  const fetchVerifications = useCallback(async () => {
    const res = await fetch("/api/admin/doctor-verifications", { cache: "no-store", credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch doctor verifications");
    const data = await res.json();
    setVerificationRequests(data.requests || []);
    setVerificationSummary(data.summary || EMPTY_SUMMARY);
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchInvitations(), fetchDoctors(), fetchVerifications()]);
    } catch {
      toast.error("Failed to load doctor admin data");
    } finally {
      setLoading(false);
    }
  }, [fetchDoctors, fetchInvitations, fetchVerifications]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const approvedDoctors = useMemo(() => doctors.filter((d) => d.isVerified), [doctors]);

  const sortedVerifications = useMemo(() => {
    const weight = { PENDING: 0, REJECTED: 1, APPROVED: 2 } as const;
    return [...verificationRequests].sort((a, b) => {
      if (weight[a.status] !== weight[b.status]) return weight[a.status] - weight[b.status];
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [verificationRequests]);

  const removeDoctor = useCallback(
    (deletedDoctorId: string | null, deletedInvitationIds: string[], deletedEmail: string | null) => {
      if (deletedDoctorId) {
        setDoctors((curr) => curr.filter((d) => d.id !== deletedDoctorId));
        setVerificationRequests((curr) => {
          const next = curr.filter((r) => r.userId !== deletedDoctorId);
          setVerificationSummary({
            total: next.length,
            pending: next.filter((r) => r.status === "PENDING").length,
            approved: next.filter((r) => r.status === "APPROVED").length,
            rejected: next.filter((r) => r.status === "REJECTED").length,
          });
          return next;
        });
      }
      if (deletedInvitationIds.length > 0 || deletedEmail) {
        setInvitations((curr) =>
          curr.filter((inv) => {
            if (deletedInvitationIds.includes(inv.id)) return false;
            if (deletedEmail && inv.email.toLowerCase() === deletedEmail) return false;
            return true;
          }),
        );
      }
    },
    [],
  );

  return {
    loading,
    invitations,
    doctors,
    approvedDoctors,
    verificationRequests: sortedVerifications,
    verificationSummary,
    fetchAll,
    fetchInvitations,
    removeDoctor,
  };
}
