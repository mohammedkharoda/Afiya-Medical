"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
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
  MapPin,
  Users,
  Calendar,
  Heart,
  Stethoscope,
  GraduationCap,
  Briefcase,
  Sparkles,
  Loader2,
  ChevronRight,
  AlertCircle,
  FlaskConical,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Doctor {
  id: string;
  name: string;
  speciality: string;
  degrees: string[];
  experience: number | null;
  hasAvailability: boolean;
  isTestAccount: boolean;
}

interface AIRecommendation {
  idealSpeciality: string;
  idealSpecialityReason: string;
  hasIdealSpecialist: boolean;
  recommendedSpeciality?: string;
  recommendedReason?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [dobDate, setDobDate] = useState<Date | undefined>(undefined);
  const [dobOpen, setDobOpen] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaSiteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || "";

  // Doctor selection state
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [selectedSpeciality, setSelectedSpeciality] = useState<string>("");
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");

  // AI recommendation state
  const [symptoms, setSymptoms] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiRecommendation, setAiRecommendation] =
    useState<AIRecommendation | null>(null);
  const [showAIHelper, setShowAIHelper] = useState(false);

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

  // Fetch doctors on mount (using public endpoint)
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await fetch("/api/doctors/public");
        if (response.ok) {
          const data = await response.json();
          setDoctors(data.doctors || []);
        }
      } catch (error) {
        console.error("Error fetching doctors:", error);
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchDoctors();
  }, []);

  // Get unique specialities from doctors
  const specialities = [...new Set(doctors.map((d) => d.speciality))].sort();

  // Get doctors for selected speciality
  const filteredDoctors = selectedSpeciality
    ? doctors.filter((d) => d.speciality === selectedSpeciality)
    : [];

  // AI recommendation function
  const getAIRecommendation = async () => {
    if (!symptoms.trim() || symptoms.length < 10) {
      toast.error(
        "Please describe your symptoms in more detail (at least 10 characters)",
      );
      return;
    }

    setLoadingAI(true);
    try {
      const response = await fetch("/api/ai/recommend-doctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms }),
      });

      if (response.ok) {
        const data = await response.json();

        // Get the ideal speciality from AI
        const idealSpeciality = data.idealSpeciality || "General Physician";
        const hasIdealSpecialist = data.hasIdealSpecialist || false;

        // Get top recommendation if available
        const topRec = data.recommendations?.[0];

        setAiRecommendation({
          idealSpeciality,
          idealSpecialityReason: data.idealSpecialityReason || "",
          hasIdealSpecialist,
          recommendedSpeciality: topRec?.speciality,
          recommendedReason: topRec?.reason,
        });

        // Auto-select the ideal speciality if available, otherwise the recommended one
        if (hasIdealSpecialist && specialities.includes(idealSpeciality)) {
          setSelectedSpeciality(idealSpeciality);
        } else if (
          topRec?.speciality &&
          specialities.includes(topRec.speciality)
        ) {
          setSelectedSpeciality(topRec.speciality);
        }
      } else {
        toast.error("Failed to get AI recommendation");
      }
    } catch (error) {
      console.error("Error getting AI recommendation:", error);
      toast.error("Failed to get AI recommendation");
    } finally {
      setLoadingAI(false);
    }
  };

  const fieldLabels: Record<string, string> = {
    name: "Full Name",
    email: "Email",
    phone: "Phone Number",
    dob: "Date of Birth",
    gender: "Gender",
    address: "Address",
    emergencyContact: "Emergency Contact Number",
    password: "Password",
  };

  const onFormError = (formErrors: Record<string, unknown>) => {
    const firstErrorKey = Object.keys(formErrors)[0];
    if (firstErrorKey) {
      const label = fieldLabels[firstErrorKey] || firstErrorKey;
      toast.error(`Please fill in the "${label}" field to continue`);

      const el =
        document.getElementById(firstErrorKey) ||
        document.querySelector(`[name="${firstErrorKey}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        if (
          el instanceof HTMLInputElement ||
          el instanceof HTMLTextAreaElement
        ) {
          el.focus();
        }
      }
    }
  };

  const onSubmit = async (data: RegisterInput) => {
    if (!selectedDoctor) {
      toast.error("Please select a doctor to continue");
      const doctorSection = document.getElementById("doctor-selection");
      if (doctorSection) {
        doctorSection.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    if (!captchaToken) {
      toast.error("Please complete the captcha to continue");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          preferredDoctorId: selectedDoctor,
          captchaToken,
        }),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Registration failed");
        return;
      }

      toast.success(
        "Account created! Please check your email for the verification code.",
      );

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
      <div className="w-full max-w-lg">
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
          <form onSubmit={handleSubmit(onSubmit, onFormError)}>
            <CardContent className="space-y-5">
              {/* Personal Information Section */}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground font-medium flex items-center gap-2">
                    <Calendar size={16} className="text-primary" />
                    Date of Birth
                  </Label>
                  <Popover open={dobOpen} onOpenChange={setDobOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={loading}
                        className={cn(
                          "h-11 w-full justify-start text-left font-normal border-input",
                          !dobDate && "text-muted-foreground",
                        )}
                      >
                        <Calendar
                          size={16}
                          className="mr-2 text-muted-foreground"
                        />
                        {dobDate
                          ? format(dobDate, "dd MMM yyyy")
                          : "Select date of birth"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dobDate}
                        onSelect={(date) => {
                          setDobDate(date);
                          if (date) {
                            setValue("dob", format(date, "yyyy-MM-dd"));
                          }
                          setDobOpen(false);
                        }}
                        disabled={(date) => date > new Date()}
                        defaultMonth={dobDate || new Date(2000, 0)}
                        captionLayout="dropdown"
                        fromYear={1920}
                        toYear={new Date().getFullYear()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <input type="hidden" {...register("dob")} />
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
                    onValueChange={(value) =>
                      setValue("gender", value as "MALE" | "FEMALE" | "OTHER")
                    }
                    disabled={loading}
                  >
                    <SelectTrigger
                      id="gender"
                      className="h-11 border-input focus:border-primary focus:ring-primary"
                    >
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
                      setValueAs: (v) =>
                        v && !v.startsWith("+91")
                          ? `+91${v.replace(/^\+91/, "")}`
                          : v,
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
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Doctor Selection Section */}
              <div
                id="doctor-selection"
                className="border-t border-border pt-6 mt-6"
              >
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Stethoscope size={20} className="text-primary" />
                  Select Your Preferred Doctor
                  <span className="text-destructive">*</span>
                </h3>

                {loadingDoctors ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">
                      Loading doctors...
                    </span>
                  </div>
                ) : doctors.length === 0 ? (
                  <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                      <p className="text-sm text-orange-800 font-medium">
                        No doctors available at the moment. Please try again
                        later.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* AI Helper Toggle */}
                    <div className="mb-4">
                      <button
                        type="button"
                        onClick={() => setShowAIHelper(!showAIHelper)}
                        className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                      >
                        <Sparkles size={16} />
                        {showAIHelper
                          ? "Hide AI Helper"
                          : "Not sure which doctor? Let AI help you"}
                        <ChevronRight
                          size={16}
                          className={cn(
                            "transition-transform",
                            showAIHelper && "rotate-90",
                          )}
                        />
                      </button>
                    </div>

                    {/* AI Symptom Input */}
                    {showAIHelper && (
                      <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 mb-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="h-5 w-5 text-primary" />
                          <span className="font-semibold text-primary">
                            AI Doctor Recommendation
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Describe your symptoms and we&apos;ll suggest the
                          right specialist for you.
                        </p>
                        <textarea
                          value={symptoms}
                          onChange={(e) => setSymptoms(e.target.value)}
                          placeholder="e.g., I have been experiencing headaches and dizziness for the past week..."
                          className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                          rows={3}
                          disabled={loading || loadingAI}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={getAIRecommendation}
                          disabled={
                            loading || loadingAI || symptoms.length < 10
                          }
                          className="mt-2"
                        >
                          {loadingAI ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Get Recommendation
                            </>
                          )}
                        </Button>

                        {/* AI Recommendation Result */}
                        {aiRecommendation && (
                          <div className="mt-3 space-y-2">
                            {/* Ideal Speciality */}
                            <div
                              className={`p-3 rounded-lg ${aiRecommendation.hasIdealSpecialist ? "bg-green-50 border border-green-200" : "bg-blue-50 border border-blue-200"}`}
                            >
                              <p
                                className={`text-sm font-medium ${aiRecommendation.hasIdealSpecialist ? "text-green-800" : "text-blue-800"}`}
                              >
                                You need:{" "}
                                <span className="font-bold">
                                  {aiRecommendation.idealSpeciality}
                                </span>
                              </p>
                              <p
                                className={`text-xs mt-1 ${aiRecommendation.hasIdealSpecialist ? "text-green-700" : "text-blue-700"}`}
                              >
                                {aiRecommendation.idealSpecialityReason}
                              </p>
                            </div>

                            {/* Not Available Warning */}
                            {!aiRecommendation.hasIdealSpecialist && (
                              <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
                                <p className="text-sm font-medium text-orange-800 flex items-center gap-2">
                                  <AlertCircle size={14} />
                                  We don&apos;t have a{" "}
                                  {aiRecommendation.idealSpeciality} at our
                                  clinic yet
                                </p>
                                {aiRecommendation.recommendedSpeciality && (
                                  <p className="text-xs text-orange-700 mt-2">
                                    <span className="font-medium">
                                      Alternative:
                                    </span>{" "}
                                    You can consult with a{" "}
                                    <span className="font-bold">
                                      {aiRecommendation.recommendedSpeciality}
                                    </span>{" "}
                                    for initial evaluation.
                                    {aiRecommendation.recommendedReason && (
                                      <span className="block mt-1">
                                        {aiRecommendation.recommendedReason}
                                      </span>
                                    )}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Speciality Selection */}
                    <div className="space-y-3 mb-4">
                      <Label className="text-foreground font-medium">
                        Select Speciality
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {specialities.map((spec) => (
                          <button
                            key={spec}
                            type="button"
                            onClick={() => {
                              setSelectedSpeciality(spec);
                              setSelectedDoctor("");
                            }}
                            className={cn(
                              "px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all",
                              selectedSpeciality === spec
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:border-primary/50",
                            )}
                          >
                            {spec}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Doctors List */}
                    {selectedSpeciality && (
                      <div className="space-y-3">
                        <Label className="text-foreground font-medium">
                          Doctors in {selectedSpeciality}
                        </Label>
                        {filteredDoctors.length === 0 ? (
                          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                            <p className="text-sm text-orange-800">
                              No doctors available for this speciality.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {filteredDoctors.map((doctor) => (
                              <div
                                key={doctor.id}
                                onClick={() => setSelectedDoctor(doctor.id)}
                                className={cn(
                                  "p-4 rounded-lg border-2 transition-all cursor-pointer",
                                  selectedDoctor === doctor.id
                                    ? "border-green-500 bg-green-50"
                                    : "border-border hover:border-primary/50",
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                      <User className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <p className="font-semibold">
                                          Dr. {doctor.name}
                                        </p>
                                        {doctor.isTestAccount && (
                                          <Badge
                                            variant="outline"
                                            className="text-xs border-orange-300 bg-orange-50 text-orange-700"
                                          >
                                            <FlaskConical className="h-3 w-3 mr-1" />
                                            Test
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        {doctor.speciality}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    {doctor.experience && (
                                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Briefcase className="h-3 w-3" />
                                        {doctor.experience} years
                                      </div>
                                    )}
                                    {!doctor.hasAvailability && (
                                      <Badge
                                        variant="outline"
                                        className="text-muted-foreground border-muted mt-1"
                                      >
                                        No slots set yet
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {doctor.degrees.length > 0 && (
                                  <div className="flex items-center gap-1 mt-2 flex-wrap">
                                    <GraduationCap className="h-3 w-3 text-muted-foreground" />
                                    {doctor.degrees.map((degree, i) => (
                                      <Badge
                                        key={i}
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {degree}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Selected Doctor Confirmation */}
                    {selectedDoctor && (
                      <>
                        <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
                          <p className="text-sm text-green-800 flex items-center gap-2">
                            <Stethoscope size={16} />
                            Selected:{" "}
                            <strong>
                              Dr.{" "}
                              {
                                doctors.find((d) => d.id === selectedDoctor)
                                  ?.name
                              }
                            </strong>
                          </p>
                        </div>
                        {doctors.find((d) => d.id === selectedDoctor)
                          ?.isTestAccount && (
                          <div className="mt-2 p-3 rounded-lg bg-orange-50 border border-orange-300">
                            <p className="text-sm text-orange-800 flex items-center gap-2 font-medium">
                              <FlaskConical
                                size={16}
                                className="text-orange-600"
                              />
                              This is a Test Account
                            </p>
                            <p className="text-xs text-orange-700 mt-1">
                              This doctor profile is for testing/demo purposes
                              only. Your data and appointments may not be
                              processed as real consultations.
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-2">
              <div className="w-full rounded-lg border border-border bg-muted/30 p-3">
                {captchaSiteKey ? (
                  <HCaptcha
                    sitekey={captchaSiteKey}
                    onVerify={(token) => setCaptchaToken(token)}
                    onExpire={() => setCaptchaToken("")}
                  />
                ) : (
                  <div className="text-xs text-destructive">
                    Captcha is not configured. Set
                    NEXT_PUBLIC_HCAPTCHA_SITE_KEY to enable.
                  </div>
                )}
              </div>
              <Button
                type="submit"
                size="lg"
                className="w-full h-12 text-base font-semibold"
                disabled={loading || !selectedDoctor || !captchaSiteKey}
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
