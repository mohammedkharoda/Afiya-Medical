"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    !token ? "error" : "loading",
  );
  const [message, setMessage] = useState(
    !token
      ? "Please click the verification link in your email to verify your account."
      : "",
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    // Verify email with token
    fetch(`/api/auth/verify-email?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");
          setMessage("Email verified successfully! You can now log in.");
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("An error occurred during verification");
      });
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            Email Verification
          </CardTitle>
          <CardDescription>
            {status === "loading" && "Verifying your email address..."}
            {status === "success" && "Email verified successfully!"}
            {status === "error" && "Verification failed"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "loading" && (
            <div className="flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
            </div>
          )}
          {status === "success" && (
            <div className="space-y-4">
              <div className="rounded-md bg-green-50 p-4 text-center text-sm text-green-800">
                {message}
              </div>
              <Button asChild className="w-full">
                <Link href="/login">Go to Login</Link>
              </Button>
            </div>
          )}
          {status === "error" && (
            <div className="space-y-4">
              <div className="rounded-md bg-red-50 p-4 text-center text-sm text-red-800">
                {message}
              </div>
              <Button asChild className="w-full">
                <Link href="/login">Go to Login</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
