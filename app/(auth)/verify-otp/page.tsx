"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

function VerifyOtpContent() {
  const router = useRouter();
  const search = useSearchParams();
  const phoneParam = search.get("phone") || "";
  const token = search.get("token") || "";
  const [phone, setPhone] = useState(phoneParam);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  // Fetch phone and email from token if token is provided
  useEffect(() => {
    if (token && !phoneParam) {
      fetch(`/api/get-phone-from-token?token=${token}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.phone) {
            setPhone(data.phone);
          }
          if (data.email) {
            setEmail(data.email);
          }
        })
        .catch(() => {
          // Ignore errors
        });
    }
  }, [token, phoneParam]);
  const ref0 = useRef<HTMLInputElement>(null);
  const ref1 = useRef<HTMLInputElement>(null);
  const ref2 = useRef<HTMLInputElement>(null);
  const ref3 = useRef<HTMLInputElement>(null);
  const ref4 = useRef<HTMLInputElement>(null);
  const ref5 = useRef<HTMLInputElement>(null);
  const inputRefs = [ref0, ref1, ref2, ref3, ref4, ref5];
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const payload: { code: string; token?: string; phone?: string } = {
        code,
      };
      if (token) payload.token = token;
      else payload.phone = phone;

      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message || "Verification failed");
        return;
      }
      toast.success("Email verified successfully!");
      // Verified — session created; go to medical history
      router.push("/medical-history/new");
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setLoading(true);
    try {
      const payload: { token?: string; phone?: string } = {};
      if (token) payload.token = token;
      else payload.phone = phone;

      const res = await fetch("/api/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message || "Failed to resend OTP");
      } else {
        toast.success("A new code has been sent to your email");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="https://res.cloudinary.com/dg2ezgumd/image/upload/v1769090131/logos_f96i4b.png"
            alt="Afiya Logo"
            width={64}
            height={64}
          />
        </div>
        <Card className="border-border shadow-xl">
          <CardHeader className="space-y-2 pb-6">
            <CardTitle className="text-3xl font-heading text-foreground">
              Verify Email
            </CardTitle>
            <CardDescription className="text-muted-foreground text-base">
              Enter the 6-digit code sent to your email address below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-3 bg-secondary/50 rounded-lg px-4 py-3 border border-border">
              <Mail className="text-primary" size={20} />
              <span className="font-mono text-base text-foreground">
                {email || "Loading..."}
              </span>
            </div>

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
                    className="w-12 h-14 text-center text-2xl font-semibold border-2 border-input rounded-lg 
                    focus:border-primary focus:ring-2 focus:ring-primary/20 bg-card text-foreground
                    transition-all duration-200"
                    value={code[idx] || ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      if (!val) return;
                      const newCode =
                        code.substring(0, idx) + val + code.substring(idx + 1);
                      setCode(newCode);
                      if (val && idx < 5) {
                        inputRefs[idx + 1].current?.focus();
                      }
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

            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary/80 hover:bg-primary/10"
                onClick={resend}
                disabled={loading}
              >
                <RefreshCw size={16} className="mr-2" />
                Resend code
              </Button>
              <Button
                size="lg"
                onClick={submit}
                disabled={loading || code.length !== 6}
                className="h-11 px-8 font-semibold bg-green-600 hover:bg-green-700 text-white"
              >
                {loading ? "Verifying..." : "Verify"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
