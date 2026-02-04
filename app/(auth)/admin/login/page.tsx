"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";

const ADMIN_EMAIL = "kharodawalam@gmail.com";

type Step = "email" | "otp";

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Handle cooldown timer
  const startCooldown = (seconds: number) => {
    setCooldown(seconds);
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited - extract remaining time
          const match = result.message?.match(/(\d+) seconds/);
          if (match) {
            startCooldown(parseInt(match[1]));
          }
        }
        toast.error(result.message || "Failed to send OTP");
        return;
      }

      toast.success("OTP sent to your email");
      setStep("otp");
      startCooldown(60);
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/admin/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), otp }),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Invalid OTP");
        return;
      }

      toast.success("Welcome, Admin!");
      router.push(result.redirectTo || "/dashboard");
      router.refresh();
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Failed to resend OTP");
        return;
      }

      toast.success("New OTP sent to your email");
      startCooldown(60);
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="https://res.cloudinary.com/dg2ezgumd/image/upload/v1769090131/logos_f96i4b.png"
            alt="Afiya Logo"
            width={64}
            height={64}
            className="object-contain"
            unoptimized
          />
        </div>

        <Card className="border-border shadow-xl">
          <CardHeader className="space-y-2 pb-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <CardTitle className="text-3xl font-heading text-foreground">
                Admin Login
              </CardTitle>
            </div>
            <CardDescription className="text-muted-foreground text-base">
              {step === "email"
                ? "Enter your admin email to receive a verification code"
                : "Enter the 6-digit code sent to your email"}
            </CardDescription>
          </CardHeader>

          {step === "email" ? (
            <form onSubmit={handleRequestOtp}>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-foreground font-medium flex items-center gap-2"
                  >
                    <Mail size={16} className="text-primary" />
                    Admin Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="h-11 border-input focus:border-primary focus:ring-primary"
                    disabled={loading}
                    readOnly
                  />
                  <p className="text-xs text-muted-foreground">
                    Only the registered admin email can access this portal
                  </p>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4 pt-2">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-12 text-base font-semibold"
                  disabled={loading}
                  variant="outline"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </Button>
              </CardFooter>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="otp"
                    className="text-foreground font-medium flex items-center gap-2"
                  >
                    Verification Code
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setOtp(value);
                    }}
                    placeholder="000000"
                    className="h-14 text-center text-2xl tracking-[0.5em] font-mono border-input focus:border-primary focus:ring-primary"
                    disabled={loading}
                    maxLength={6}
                    autoComplete="one-time-code"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Code sent to {email}
                  </p>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4 pt-2">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-12 text-base font-semibold"
                  disabled={loading || otp.length !== 6}
                  variant="outline"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Login"
                  )}
                </Button>

                <div className="flex items-center justify-between w-full">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStep("email");
                      setOtp("");
                    }}
                    disabled={loading}
                  >
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Back
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResendOtp}
                    disabled={loading || cooldown > 0}
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
                  </Button>
                </div>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
