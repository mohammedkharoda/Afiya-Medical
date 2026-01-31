"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
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
import { User, Mail, Phone, Lock, Eye, EyeOff, MapPin, Users, Calendar, Heart } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "PATIENT",
    },
  });

  const gender = watch("gender");

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Registration failed");
        return;
      }

      toast.success("Account created! Please verify your phone number.");

      // Redirect to OTP verification page with token (phone hidden)
      if (result?.token) {
        router.push(`/verify-otp?token=${result.token}`);
      } else {
        const encoded = encodeURIComponent(data.phone || "");
        router.push(`/verify-otp?phone=${encoded}`);
      }
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
          />
        </div>
        <Card className="border-border shadow-xl">
          <CardHeader className="space-y-2 pb-6">
            <CardTitle className="text-3xl font-heading text-foreground">
              Create an account
            </CardTitle>
            <CardDescription className="text-muted-foreground text-base">
              Enter your information to create your account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-foreground font-medium flex items-center gap-2"
                >
                  <User size={16} className="text-primary" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  className="h-11 border-input focus:border-primary focus:ring-primary"
                  {...register("name")}
                  disabled={loading}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

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
                  placeholder="you@example.com"
                  className="h-11 border-input focus:border-primary focus:ring-primary"
                  {...register("email")}
                  disabled={loading}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="phone"
                  className="text-foreground font-medium flex items-center gap-2"
                >
                  <Phone size={16} className="text-primary" />
                  Phone Number
                </Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 h-11 text-sm text-foreground bg-muted border border-r-0 border-input rounded-l-md font-medium">
                    +91
                  </span>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    className="h-11 border-input focus:border-primary focus:ring-primary rounded-l-none"
                    {...register("phone", {
                      setValueAs: (v) => (v && !v.startsWith("+91") ? `+91${v.replace(/^\+91/, "")}` : v),
                    })}
                    disabled={loading}
                  />
                </div>
                {errors.phone && (
                  <p className="text-sm text-destructive">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="dob"
                    className="text-foreground font-medium flex items-center gap-2"
                  >
                    <Calendar size={16} className="text-primary" />
                    Date of Birth
                  </Label>
                  <Input
                    id="dob"
                    type="date"
                    className="h-11 border-input focus:border-primary focus:ring-primary"
                    {...register("dob")}
                    disabled={loading}
                    max={new Date().toISOString().split("T")[0]}
                  />
                  {errors.dob && (
                    <p className="text-sm text-destructive">
                      {errors.dob.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground font-medium flex items-center gap-2">
                    <Users size={16} className="text-primary" />
                    Gender
                  </Label>
                  <Select
                    value={gender}
                    onValueChange={(value) => setValue("gender", value as "MALE" | "FEMALE" | "OTHER")}
                    disabled={loading}
                  >
                    <SelectTrigger className="h-11 border-input focus:border-primary focus:ring-primary">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && (
                    <p className="text-sm text-destructive">
                      {errors.gender.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="address"
                  className="text-foreground font-medium flex items-center gap-2"
                >
                  <MapPin size={16} className="text-primary" />
                  Address
                </Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="123 Main St, City, State, ZIP"
                  className="h-11 border-input focus:border-primary focus:ring-primary"
                  {...register("address")}
                  disabled={loading}
                />
                {errors.address && (
                  <p className="text-sm text-destructive">
                    {errors.address.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="emergencyContact"
                  className="text-foreground font-medium flex items-center gap-2"
                >
                  <Phone size={16} className="text-primary" />
                  Emergency Contact Number
                </Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 h-11 text-sm text-foreground bg-muted border border-r-0 border-input rounded-l-md font-medium">
                    +91
                  </span>
                  <Input
                    id="emergencyContact"
                    type="tel"
                    placeholder="9876543210"
                    className="h-11 border-input focus:border-primary focus:ring-primary rounded-l-none"
                    {...register("emergencyContact", {
                      setValueAs: (v) => (v && !v.startsWith("+91") ? `+91${v.replace(/^\+91/, "")}` : v),
                    })}
                    disabled={loading}
                  />
                </div>
                {errors.emergencyContact && (
                  <p className="text-sm text-destructive">
                    {errors.emergencyContact.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="bloodGroup"
                  className="text-foreground font-medium flex items-center gap-2"
                >
                  <Heart size={16} className="text-primary" />
                  Blood Group (Optional)
                </Label>
                <Input
                  id="bloodGroup"
                  type="text"
                  placeholder="e.g., A+, O-, B+"
                  className="h-11 border-input focus:border-primary focus:ring-primary"
                  {...register("bloodGroup")}
                  disabled={loading}
                />
                {errors.bloodGroup && (
                  <p className="text-sm text-destructive">
                    {errors.bloodGroup.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-foreground font-medium flex items-center gap-2"
                >
                  <Lock size={16} className="text-primary" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="h-11 border-input focus:border-primary focus:ring-primary pr-10"
                    {...register("password")}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button
                type="submit"
                size="lg"
                variant={"outline"}
                className="w-full h-12 text-base font-semibold"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create account"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
