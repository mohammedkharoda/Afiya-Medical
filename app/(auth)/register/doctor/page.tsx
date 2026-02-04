"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { z } from "zod";
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
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Stethoscope,
  AlertCircle,
  Loader2,
  GraduationCap,
  X,
  Plus,
  Briefcase,
  CreditCard,
  MapPin,
} from "lucide-react";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import PasswordValidator from "password-validator";

// Password validator
const pwdSchema = new PasswordValidator();
pwdSchema
  .is()
  .min(8)
  .has()
  .uppercase()
  .has()
  .lowercase()
  .has()
  .digits()
  .has()
  .symbols()
  .has()
  .not()
  .spaces();

// Client-side validation schema (without token)
const doctorFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().refine(
    (val) => {
      if (!val.startsWith("+91")) return false;
      const phone = parsePhoneNumberFromString(val, "IN");
      return phone ? phone.isValid() : false;
    },
    {
      message: "Phone number must start with +91 and be a valid Indian number",
    },
  ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .refine(
      (val) => {
        try {
          return pwdSchema.validate(val);
        } catch {
          return false;
        }
      },
      {
        message:
          "Password must include uppercase, lowercase, number, and a symbol",
      },
    ),
  specialities: z.array(z.string()).min(1, "At least one speciality is required"),
  degrees: z.array(z.string()).min(1, "At least one degree is required"),
  experience: z.number().min(0).optional(),
  upiId: z.string().min(1, "UPI ID is required for receiving payments"),
  clinicAddress: z.string().min(5, "Clinic address is required"),
});

type DoctorFormInput = z.infer<typeof doctorFormSchema>;

interface InvitationData {
  valid: boolean;
  email?: string;
  name?: string;
  reason?: string;
}

function DoctorRegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Specialities state
  const [specialities, setSpecialities] = useState<string[]>([]);
  const [newSpeciality, setNewSpeciality] = useState("");

  // Degrees state
  const [degrees, setDegrees] = useState<string[]>([]);
  const [newDegree, setNewDegree] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<DoctorFormInput>({
    resolver: zodResolver(doctorFormSchema),
    defaultValues: {
      specialities: [],
      degrees: [],
      experience: 0,
    },
  });

  // Speciality management
  const addSpeciality = (speciality: string) => {
    const trimmed = speciality.trim();
    if (trimmed && !specialities.includes(trimmed)) {
      const updated = [...specialities, trimmed];
      setSpecialities(updated);
      setValue("specialities", updated);
    }
    setNewSpeciality("");
  };

  const removeSpeciality = (speciality: string) => {
    const updated = specialities.filter((s) => s !== speciality);
    setSpecialities(updated);
    setValue("specialities", updated);
  };

  // Degree management
  const addDegree = (degree: string) => {
    const trimmed = degree.trim();
    if (trimmed && !degrees.includes(trimmed)) {
      const updated = [...degrees, trimmed];
      setDegrees(updated);
      setValue("degrees", updated);
    }
    setNewDegree("");
  };

  const removeDegree = (degree: string) => {
    const updated = degrees.filter((d) => d !== degree);
    setDegrees(updated);
    setValue("degrees", updated);
  };

  // Validate invitation token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setInvitation({ valid: false, reason: "missing" });
        setValidating(false);
        return;
      }

      try {
        const response = await fetch(`/api/invitations/${token}`);
        const data = await response.json();

        setInvitation(data);

        // Pre-fill form with invitation data
        if (data.valid) {
          setValue("email", data.email);
          if (data.name) {
            setValue("name", data.name);
          }
        }
      } catch {
        setInvitation({ valid: false, reason: "error" });
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [token, setValue]);

  const onSubmit = async (data: DoctorFormInput) => {
    if (!token) {
      toast.error("Invalid invitation token");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/register/doctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          token,
          // Convert specialities array to single string for backend compatibility
          speciality: data.specialities.join(", "),
          clinicAddress: data.clinicAddress,
        }),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Registration failed");
        return;
      }

      toast.success("Registration successful! Welcome to Afiya.");
      router.push(result.redirectTo || "/dashboard");
      router.refresh();
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (validating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Validating invitation...</p>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!invitation?.valid) {
    const errorMessages: Record<
      string,
      { title: string; description: string }
    > = {
      missing: {
        title: "Invalid Link",
        description:
          "This registration link is invalid. Please contact the admin for a new invitation.",
      },
      expired: {
        title: "Invitation Expired",
        description:
          "This invitation has expired. Please contact the admin for a new invitation.",
      },
      used: {
        title: "Invitation Already Used",
        description:
          "This invitation has already been used. If you need help accessing your account, please contact the admin.",
      },
      revoked: {
        title: "Invitation Revoked",
        description:
          "This invitation has been revoked. Please contact the admin if you believe this is an error.",
      },
      error: {
        title: "Something Went Wrong",
        description:
          "We couldn't validate your invitation. Please try again or contact the admin.",
      },
    };

    const error = errorMessages[invitation?.reason || "error"];

    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md border-border shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-heading">
              {error.title}
            </CardTitle>
            <CardDescription className="text-base">
              {error.description}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button variant="outline" onClick={() => router.push("/login")}>
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Registration form
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="https://res.cloudinary.com/dg2ezgumd/image/upload/v1769090131/logos_f96i4b.png"
            alt="Afiya Logo"
            width={64}
            height={64}
            unoptimized
          />
        </div>

        <Card className="border-border shadow-xl">
          <CardHeader className="space-y-2 pb-6">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-6 w-6 text-primary" />
              <CardTitle className="text-3xl font-heading text-foreground">
                Doctor Registration
              </CardTitle>
            </div>
            <CardDescription className="text-muted-foreground text-base">
              Complete your registration to join Afiya Medical Clinic
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
                  placeholder="Dr. John Doe"
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
                  className="h-11 border-input bg-muted"
                  {...register("email")}
                  disabled
                  readOnly
                />
                <p className="text-xs text-muted-foreground">
                  Email is pre-filled from your invitation and cannot be changed
                </p>
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
                      setValueAs: (v) =>
                        v && !v.startsWith("+91")
                          ? `+91${v.replace(/^\+91/, "")}`
                          : v,
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
                    placeholder="Create a strong password"
                    className="h-11 border-input focus:border-primary focus:ring-primary pr-10"
                    {...register("password")}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Must be 8+ characters with uppercase, lowercase, number, and
                  symbol
                </p>
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="border-t border-border pt-4 mt-4">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <GraduationCap size={20} className="text-primary" />
                  Professional Information
                </h3>
              </div>

              {/* Specialities - Add one by one */}
              <div className="space-y-2">
                <Label className="text-foreground font-medium flex items-center gap-2">
                  <Stethoscope size={16} className="text-primary" />
                  Specialities
                </Label>
                {specialities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {specialities.map((speciality) => (
                      <div
                        key={speciality}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-primary/20 rounded-lg text-sm font-medium text-foreground shadow-sm"
                      >
                        <Stethoscope size={14} className="text-primary" />
                        {speciality}
                        <button
                          type="button"
                          onClick={() => removeSpeciality(speciality)}
                          className="ml-1 p-0.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter speciality (e.g., Cardiologist)"
                    className="h-11 flex-1"
                    value={newSpeciality}
                    onChange={(e) => setNewSpeciality(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSpeciality(newSpeciality);
                      }
                    }}
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 border-primary/30 hover:bg-primary/10"
                    onClick={() => addSpeciality(newSpeciality)}
                    disabled={loading || !newSpeciality.trim()}
                  >
                    <Plus size={18} />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Add your specialities one by one and press Enter or click +
                </p>
                {errors.specialities && (
                  <p className="text-sm text-destructive">
                    {errors.specialities.message}
                  </p>
                )}
              </div>

              {/* Degrees & Qualifications - Add one by one */}
              <div className="space-y-2">
                <Label className="text-foreground font-medium flex items-center gap-2">
                  <GraduationCap size={16} className="text-primary" />
                  Degrees & Qualifications
                </Label>
                {degrees.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {degrees.map((degree) => (
                      <div
                        key={degree}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-primary/20 rounded-lg text-sm font-medium text-foreground shadow-sm"
                      >
                        <GraduationCap size={14} className="text-primary" />
                        {degree}
                        <button
                          type="button"
                          onClick={() => removeDegree(degree)}
                          className="ml-1 p-0.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter degree (e.g., MBBS, MD)"
                    className="h-11 flex-1"
                    value={newDegree}
                    onChange={(e) => setNewDegree(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addDegree(newDegree);
                      }
                    }}
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 border-primary/30 hover:bg-primary/10"
                    onClick={() => addDegree(newDegree)}
                    disabled={loading || !newDegree.trim()}
                  >
                    <Plus size={18} />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Add your degrees one by one and press Enter or click +
                </p>
                {errors.degrees && (
                  <p className="text-sm text-destructive">
                    {errors.degrees.message}
                  </p>
                )}
              </div>

              {/* Experience */}
              <div className="space-y-2">
                <Label
                  htmlFor="experience"
                  className="text-foreground font-medium flex items-center gap-2"
                >
                  <Briefcase size={16} className="text-primary" />
                  Experience (Years)
                </Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  placeholder="5"
                  className="h-11"
                  {...register("experience", { valueAsNumber: true })}
                  disabled={loading}
                />
              </div>

              {/* Clinic Address - Required */}
              <div className="space-y-2">
                <Label
                  htmlFor="clinicAddress"
                  className="text-foreground font-medium flex items-center gap-2"
                >
                  <MapPin size={16} className="text-primary" />
                  Clinic Address
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="clinicAddress"
                  type="text"
                  placeholder="123 Medical Plaza, City, State, PIN"
                  className="h-11"
                  {...register("clinicAddress")}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  This address will be shared with patients in appointment emails
                </p>
                {errors.clinicAddress && (
                  <p className="text-sm text-destructive">
                    {errors.clinicAddress.message}
                  </p>
                )}
              </div>

              {/* UPI ID - Required */}
              <div className="space-y-2">
                <Label
                  htmlFor="upiId"
                  className="text-foreground font-medium flex items-center gap-2"
                >
                  <CreditCard size={16} className="text-primary" />
                  UPI ID
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="upiId"
                  type="text"
                  placeholder="yourname@upi"
                  className="h-11"
                  {...register("upiId")}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Patients will pay consultation fees to this UPI ID
                </p>
                {errors.upiId && (
                  <p className="text-sm text-destructive">
                    {errors.upiId.message}
                  </p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button
                type="submit"
                size="lg"
                variant="outline"
                className="w-full h-12 text-base font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Complete Registration"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default function DoctorRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <DoctorRegisterForm />
    </Suspense>
  );
}
