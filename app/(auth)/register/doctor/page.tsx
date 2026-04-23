"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { z } from "zod";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import PasswordValidator from "password-validator";
import { toast } from "sonner";
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
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  Clock3,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Plus,
  ShieldCheck,
  Stethoscope,
  Upload,
  User,
  X,
} from "lucide-react";

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
  experience: z.preprocess(
    (value) =>
      value === "" || value === undefined || Number.isNaN(value)
        ? undefined
        : value,
    z.number().min(0, "Experience cannot be negative").optional(),
  ),
  upiId: z.string().min(1, "UPI ID is required"),
  clinicAddress: z.string().min(5, "Clinic address is required"),
  registrationNumber: z
    .string()
    .min(5, "Medical registration number is required"),
  registrationCertificateUrl: z
    .string()
    .min(1, "Registration certificate upload is required"),
  registrationCertificateName: z
    .string()
    .min(1, "Registration certificate file name is required"),
  aadhaarCardUrl: z.string().min(1, "Aadhaar card upload is required"),
  aadhaarCardName: z.string().min(1, "Aadhaar card file name is required"),
  panCardUrl: z.string().min(1, "PAN card upload is required"),
  panCardName: z.string().min(1, "PAN card file name is required"),
});

type DoctorFormValues = z.input<typeof doctorFormSchema>;
type DoctorFormInput = z.output<typeof doctorFormSchema>;

interface InvitationData {
  valid: boolean;
  email?: string;
  name?: string;
  reason?: string;
  isTestAccount?: boolean;
}

type DocumentField = "registrationCertificate" | "aadhaarCard" | "panCard";

interface UploadedDocument {
  fileUrl: string;
  fileName: string;
}

const documentFieldMap = {
  registrationCertificate: {
    title: "Medical Registration Certificate",
    subtitle: "Upload state medical council registration or licence proof",
    icon: ShieldCheck,
    urlKey: "registrationCertificateUrl" as const,
    nameKey: "registrationCertificateName" as const,
  },
  aadhaarCard: {
    title: "Aadhaar Card",
    subtitle: "Upload the identity proof used for doctor verification",
    icon: FileText,
    urlKey: "aadhaarCardUrl" as const,
    nameKey: "aadhaarCardName" as const,
  },
  panCard: {
    title: "PAN Card",
    subtitle: "Upload PAN for identity and financial verification",
    icon: CreditCard,
    urlKey: "panCardUrl" as const,
    nameKey: "panCardName" as const,
  },
};

function DoctorRegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploadingField, setUploadingField] = useState<DocumentField | null>(
    null,
  );

  const [specialities, setSpecialities] = useState<string[]>([]);
  const [newSpeciality, setNewSpeciality] = useState("");
  const [degrees, setDegrees] = useState<string[]>([]);
  const [newDegree, setNewDegree] = useState("");
  const [documents, setDocuments] = useState<
    Record<DocumentField, UploadedDocument | null>
  >({
    registrationCertificate: null,
    aadhaarCard: null,
    panCard: null,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    trigger,
  } = useForm<DoctorFormValues, unknown, DoctorFormInput>({
    resolver: zodResolver(doctorFormSchema),
    defaultValues: {
      specialities: [],
      degrees: [],
    },
  });

  const addSpeciality = (speciality: string) => {
    const trimmed = speciality.trim();
    if (trimmed && !specialities.includes(trimmed)) {
      const updated = [...specialities, trimmed];
      setSpecialities(updated);
      setValue("specialities", updated, { shouldValidate: true });
    }
    setNewSpeciality("");
  };

  const removeSpeciality = (speciality: string) => {
    const updated = specialities.filter((item) => item !== speciality);
    setSpecialities(updated);
    setValue("specialities", updated, { shouldValidate: true });
  };

  const addDegree = (degree: string) => {
    const trimmed = degree.trim();
    if (trimmed && !degrees.includes(trimmed)) {
      const updated = [...degrees, trimmed];
      setDegrees(updated);
      setValue("degrees", updated, { shouldValidate: true });
    }
    setNewDegree("");
  };

  const removeDegree = (degree: string) => {
    const updated = degrees.filter((item) => item !== degree);
    setDegrees(updated);
    setValue("degrees", updated, { shouldValidate: true });
  };

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
  }, [setValue, token]);

  const handleDocumentUpload = async (
    field: DocumentField,
    file: File | undefined,
  ) => {
    if (!file) return;

    const isValidType =
      file.type === "application/pdf" ||
      file.type.startsWith("image/jpeg") ||
      file.type.startsWith("image/png") ||
      file.type.startsWith("image/webp");

    if (!isValidType) {
      toast.error("Please upload a PDF, JPG, PNG, or WEBP file");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error("Each document must be smaller than 8 MB");
      return;
    }

    setUploadingField(field);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Upload failed");
        return;
      }

      const config = documentFieldMap[field];
      const uploaded = {
        fileUrl: result.fileUrl as string,
        fileName: result.fileName as string,
      };

      setDocuments((current) => ({
        ...current,
        [field]: uploaded,
      }));
      setValue(config.urlKey, uploaded.fileUrl, { shouldValidate: true });
      setValue(config.nameKey, uploaded.fileName, { shouldValidate: true });
      await trigger([config.urlKey, config.nameKey]);
      toast.success(`${config.title} uploaded`);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploadingField(null);
    }
  };

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
          speciality: data.specialities.join(", "),
        }),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Registration failed");
        return;
      }

      toast.success(
        "Registration submitted. Your documents are now pending admin review.",
      );
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

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

  if (!invitation?.valid) {
    const errorMessages: Record<string, { title: string; description: string }> =
      {
        missing: {
          title: "Invalid Link",
          description:
            "This registration link is invalid. Please return to /register and request a fresh doctor registration email.",
        },
        expired: {
          title: "Invitation Expired",
          description:
            "This invitation has expired. Please return to /register and request a new doctor registration email.",
        },
        used: {
          title: "Invitation Already Used",
          description:
            "This invitation has already been used. If you still need access, request a fresh doctor registration email from /register.",
        },
        revoked: {
          title: "Invitation Revoked",
          description:
            "This invitation has been revoked. Please return to /register and request a fresh doctor registration email.",
        },
        error: {
          title: "Something Went Wrong",
          description:
            "We couldn't validate your invitation right now. Please try again, or request a fresh doctor registration email from /register.",
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

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <Card className="w-full max-w-2xl border-border shadow-xl">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <CardTitle className="text-3xl font-heading text-foreground">
                Documents Submitted
              </CardTitle>
              <CardDescription className="mt-2 text-base text-muted-foreground">
                Your doctor profile has been created and sent for admin review.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-primary/15 bg-primary/5 p-5">
              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">
                    What happens next
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    The admin team will review your registration number,
                    certificate, Aadhaar card, and PAN card. Login will become
                    available once your doctor profile is approved.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 rounded-2xl border border-border bg-card/70 p-5 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Invited Email
                </p>
                <p className="mt-1 font-medium text-foreground">
                  {invitation.email}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Review Status
                </p>
                <Badge className="mt-2 w-fit bg-amber-100 text-amber-800 hover:bg-amber-100">
                  Pending admin approval
                </Badge>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={() => router.push("/login")}>Go to Login</Button>
            <Button variant="outline" onClick={() => router.push("/")}>
              Back to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-8 flex flex-col items-center">
          <Image
            src="/logos.png"
            alt="Afiya Logo"
            width={84}
            height={84}
            className="object-contain"
            unoptimized
          />
        </div>

        <Card className="border-border shadow-xl">
          <CardHeader className="space-y-4 border-b border-border/70 pb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-6 w-6 text-primary" />
                  <CardTitle className="text-3xl font-heading text-foreground">
                    Doctor Registration
                  </CardTitle>
                </div>
                <CardDescription className="max-w-2xl text-base text-muted-foreground">
                  Complete your profile and upload verification documents so the
                  admin team can approve your doctor account.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-primary/20 bg-primary/5">
                  Invitation verified
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
            </div>

            <div className="grid gap-3 rounded-2xl border border-border bg-card/60 p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Invitation Email
                </p>
                <p className="mt-1 font-medium text-foreground">
                  {invitation.email}
                </p>
              </div>
              <div>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[#1c2430]">
                  Review Requirement
                </p>
                <p className="mt-2 text-[1.1rem] font-medium leading-[1.35] text-[#111827]">
                  Admin approval is required before login
                </p>
              </div>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-8 p-6 sm:p-8">
              <input type="hidden" {...register("registrationCertificateUrl")} />
              <input type="hidden" {...register("registrationCertificateName")} />
              <input type="hidden" {...register("aadhaarCardUrl")} />
              <input type="hidden" {...register("aadhaarCardName")} />
              <input type="hidden" {...register("panCardUrl")} />
              <input type="hidden" {...register("panCardName")} />

              <section className="space-y-5">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Account Details
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Basic account information for your doctor login.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="flex items-center gap-2 font-medium text-foreground"
                    >
                      <User size={16} className="text-primary" />
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      placeholder="Dr. John Doe"
                      className="h-11"
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
                      className="flex items-center gap-2 font-medium text-foreground"
                    >
                      <Mail size={16} className="text-primary" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      className="h-11 bg-muted"
                      {...register("email")}
                      disabled
                      readOnly
                    />
                    <p className="text-xs text-muted-foreground">
                      Email is pre-filled from your invitation.
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
                      className="flex items-center gap-2 font-medium text-foreground"
                    >
                      <Phone size={16} className="text-primary" />
                      Phone Number
                    </Label>
                    <div className="flex">
                      <span className="inline-flex h-11 items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm font-medium text-foreground">
                        +91
                      </span>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="9876543210"
                        className="h-11 rounded-l-none"
                        {...register("phone", {
                          setValueAs: (value) =>
                            value && !value.startsWith("+91")
                              ? `+91${String(value).replace(/^\+91/, "")}`
                              : value,
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
                      className="flex items-center gap-2 font-medium text-foreground"
                    >
                      <Lock size={16} className="text-primary" />
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        className="h-11 pr-10"
                        {...register("password")}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Use 8+ characters with uppercase, lowercase, number, and
                      symbol.
                    </p>
                    {errors.password && (
                      <p className="text-sm text-destructive">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section className="space-y-5 border-t border-border pt-8">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Professional Profile
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Tell patients and the admin team about your practice.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 font-medium text-foreground">
                      <Stethoscope size={16} className="text-primary" />
                      Specialities
                    </Label>
                    {specialities.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {specialities.map((speciality) => (
                          <div
                            key={speciality}
                            className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-medium text-foreground"
                          >
                            <Stethoscope size={14} className="text-primary" />
                            {speciality}
                            <button
                              type="button"
                              onClick={() => removeSpeciality(speciality)}
                              className="text-muted-foreground transition-colors hover:text-destructive"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <div className="flex gap-2">
                      <Input
                        value={newSpeciality}
                        placeholder="e.g. Cardiologist"
                        className="h-11"
                        onChange={(event) => setNewSpeciality(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            addSpeciality(newSpeciality);
                          }
                        }}
                        disabled={loading}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-11 w-11"
                        onClick={() => addSpeciality(newSpeciality)}
                        disabled={loading || !newSpeciality.trim()}
                      >
                        <Plus size={18} />
                      </Button>
                    </div>
                    {errors.specialities && (
                      <p className="text-sm text-destructive">
                        {errors.specialities.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 font-medium text-foreground">
                      <GraduationCap size={16} className="text-primary" />
                      Degrees & Qualifications
                    </Label>
                    {degrees.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {degrees.map((degree) => (
                          <div
                            key={degree}
                            className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-medium text-foreground"
                          >
                            <GraduationCap size={14} className="text-primary" />
                            {degree}
                            <button
                              type="button"
                              onClick={() => removeDegree(degree)}
                              className="text-muted-foreground transition-colors hover:text-destructive"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <div className="flex gap-2">
                      <Input
                        value={newDegree}
                        placeholder="e.g. MBBS, MD"
                        className="h-11"
                        onChange={(event) => setNewDegree(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            addDegree(newDegree);
                          }
                        }}
                        disabled={loading}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-11 w-11"
                        onClick={() => addDegree(newDegree)}
                        disabled={loading || !newDegree.trim()}
                      >
                        <Plus size={18} />
                      </Button>
                    </div>
                    {errors.degrees && (
                      <p className="text-sm text-destructive">
                        {errors.degrees.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="experience"
                      className="flex items-center gap-2 font-medium text-foreground"
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
                    {errors.experience && (
                      <p className="text-sm text-destructive">
                        {errors.experience.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="registrationNumber"
                      className="flex items-center gap-2 font-medium text-foreground"
                    >
                      <ShieldCheck size={16} className="text-primary" />
                      Registration Number
                    </Label>
                    <Input
                      id="registrationNumber"
                      placeholder="e.g. MCI-123456"
                      className="h-11"
                      {...register("registrationNumber")}
                      disabled={loading}
                    />
                    {errors.registrationNumber && (
                      <p className="text-sm text-destructive">
                        {errors.registrationNumber.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label
                      htmlFor="clinicAddress"
                      className="flex items-center gap-2 font-medium text-foreground"
                    >
                      <MapPin size={16} className="text-primary" />
                      Clinic Address
                    </Label>
                    <Input
                      id="clinicAddress"
                      placeholder="123 Medical Plaza, City, State, PIN"
                      className="h-11"
                      {...register("clinicAddress")}
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Patients will see this in appointment communication after
                      approval.
                    </p>
                    {errors.clinicAddress && (
                      <p className="text-sm text-destructive">
                        {errors.clinicAddress.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label
                      htmlFor="upiId"
                      className="flex items-center gap-2 font-medium text-foreground"
                    >
                      <CreditCard size={16} className="text-primary" />
                      UPI ID
                    </Label>
                    <Input
                      id="upiId"
                      placeholder="doctor@upi"
                      className="h-11"
                      {...register("upiId")}
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Consultation payments will route here once your account is
                      approved.
                    </p>
                    {errors.upiId && (
                      <p className="text-sm text-destructive">
                        {errors.upiId.message}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section className="space-y-5 border-t border-border pt-8">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Verification Documents
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Upload the required files for admin review. PDF and image
                    formats are supported.
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  {(Object.keys(documentFieldMap) as DocumentField[]).map(
                    (field) => {
                      const config = documentFieldMap[field];
                      const Icon = config.icon;
                      const uploaded = documents[field];
                      const isUploading = uploadingField === field;
                      const fieldError =
                        errors[config.urlKey]?.message ||
                        errors[config.nameKey]?.message;

                      return (
                        <div
                          key={field}
                          className="rounded-2xl border border-border bg-card/60 p-4"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-foreground">
                                {config.title}
                              </p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {config.subtitle}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 space-y-3">
                            <Label
                              htmlFor={`${field}-upload`}
                              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                            >
                              {isUploading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4" />
                              )}
                              {uploaded ? "Replace file" : "Upload file"}
                            </Label>
                            <Input
                              id={`${field}-upload`}
                              type="file"
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png,.webp"
                              onChange={(event) =>
                                handleDocumentUpload(
                                  field,
                                  event.target.files?.[0],
                                )
                              }
                              disabled={loading || isUploading}
                            />

                            {uploaded ? (
                              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                                <div className="flex items-start gap-2">
                                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-emerald-900">
                                      {uploaded.fileName}
                                    </p>
                                    <a
                                      href={uploaded.fileUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800"
                                    >
                                      <FileText className="h-3.5 w-3.5" />
                                      Preview uploaded file
                                    </a>
                                  </div>
                                </div>
                              </div>
                            ) : null}

                            {fieldError ? (
                              <p className="text-sm text-destructive">
                                {fieldError}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </section>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 border-t border-border/70 p-6 sm:flex-row sm:justify-between sm:p-8">
              <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
                Admin review is required before the doctor account can log in.
              </div>
              <Button
                type="submit"
                size="lg"
                className="h-14 min-w-[19rem] rounded-full border border-[#d7c3a3] bg-[#f5ead8] px-10 text-[1.02rem] font-semibold tracking-[0.01em] text-[#18212b] shadow-[0_16px_30px_-24px_rgba(17,24,39,0.34),0_1px_0_rgba(255,255,255,0.72)_inset] hover:-translate-y-0.5 hover:border-[#cdb38f] hover:bg-[#f1e3cf] hover:text-[#101826] active:translate-y-0 active:shadow-[0_10px_18px_-16px_rgba(17,24,39,0.28),0_1px_0_rgba(255,255,255,0.65)_inset] focus-visible:ring-[#c8a46b]/45"
                disabled={loading || uploadingField !== null}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting for review...
                  </>
                ) : (
                  "Submit Doctor Registration"
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
