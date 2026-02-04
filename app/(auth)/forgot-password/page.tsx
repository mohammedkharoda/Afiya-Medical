"use client";

import { useState, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
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
import {
  Mail,
  ArrowLeft,
  RefreshCw,
  Loader2,
  KeyRound,
} from "lucide-react";

type Step = "email" | "otp";

function ForgotPasswordContent() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const ref0 = useRef<HTMLInputElement>(null);
  const ref1 = useRef<HTMLInputElement>(null);
  const ref2 = useRef<HTMLInputElement>(null);
  const ref3 = useRef<HTMLInputElement>(null);
  const ref4 = useRef<HTMLInputElement>(null);
  const ref5 = useRef<HTMLInputElement>(null);
  const inputRefs = [ref0, ref1, ref2, ref3, ref4, ref5];

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

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          toast.error(
            json.message || "Please wait before requesting another code",
          );
        } else {
          toast.error(json.message || "Failed to send OTP");
        }
        return;
      }
      toast.success(
        "If an account exists, an OTP has been sent to your email",
      );
      setStep("otp");
      startCooldown(60);
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    if (code.length !== 6) return;
    setLoading(true);
    try {
      const res = await fetch("/api/forgot-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: code }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message || "Verification failed");
        return;
      }
      toast.success("OTP verified! Set your new password.");
      router.push(`/reset-password?token=${json.resetToken}`);
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (cooldown > 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message || "Failed to resend OTP");
        return;
      }
      toast.success("A new code has been sent");
      startCooldown(60);
      setCode("");
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
            <CardTitle className="text-3xl font-heading text-foreground flex items-center gap-2">
              <KeyRound className="h-7 w-7 text-primary" />
              {step === "email" ? "Forgot Password" : "Enter OTP"}
            </CardTitle>
            <CardDescription className="text-muted-foreground text-base">
              {step === "email"
                ? "Enter your email address and we'll send you a verification code"
                : `Enter the 6-digit code sent to ${email}`}
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
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-11 border-input focus:border-primary focus:ring-primary"
                    disabled={loading}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4 pt-2">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-12 text-base font-semibold"
                  disabled={loading || !email.trim()}
                  variant="outline"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Remember your password?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </CardFooter>
            </form>
          ) : (
            <div>
              <CardContent className="space-y-6">
                {/* Email display */}
                <div className="flex items-center gap-3 bg-secondary/50 rounded-lg px-4 py-3 border border-border">
                  <Mail className="text-primary" size={20} />
                  <span className="font-mono text-base text-foreground">
                    {email}
                  </span>
                </div>

                {/* 6-digit OTP input */}
                <div className="space-y-3">
                  <Label className="text-foreground font-medium">
                    Verification Code
                  </Label>
                  <div className="flex gap-3 justify-center">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <input
                        key={idx}
                        ref={inputRefs[idx]}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        className="w-12 h-14 text-center text-2xl font-semibold border-2 border-input rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 bg-card text-foreground transition-all duration-200"
                        value={code[idx] || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, "");
                          if (!val) return;
                          const newCode =
                            code.substring(0, idx) +
                            val +
                            code.substring(idx + 1);
                          setCode(newCode);
                          if (val && idx < 5)
                            inputRefs[idx + 1].current?.focus();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace") {
                            if (code[idx]) {
                              setCode(
                                code.substring(0, idx) +
                                  "" +
                                  code.substring(idx + 1),
                              );
                            } else if (idx > 0) {
                              inputRefs[idx - 1].current?.focus();
                            }
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStep("email");
                      setCode("");
                    }}
                    disabled={loading}
                  >
                    <ArrowLeft size={16} className="mr-1" /> Back
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResend}
                    disabled={loading || cooldown > 0}
                    className="text-primary hover:text-primary/80 hover:bg-primary/10"
                  >
                    <RefreshCw size={16} className="mr-2" />
                    {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                  </Button>
                </div>

                <Button
                  size="lg"
                  onClick={handleVerifyOtp}
                  disabled={loading || code.length !== 6}
                  className="w-full h-12 text-base font-semibold"
                  variant="outline"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify OTP"
                  )}
                </Button>
              </CardContent>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
