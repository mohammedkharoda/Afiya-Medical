"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { format } from "date-fns";
import {
  User,
  Mail,
  Phone,
  CalendarIcon,
  MapPin,
  Heart,
  Shield,
  Edit2,
  Save,
  X,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ShareApp } from "@/components/share-app";

type UserRole = "PATIENT" | "DOCTOR" | "ADMIN";
type Gender = "MALE" | "FEMALE" | "OTHER";

interface UserData {
  id: string;
  email: string;
  name: string;
  role?: UserRole;
  phone?: string;
  image?: string;
  emailVerified?: boolean;
  createdAt?: string;
}

interface PatientProfile {
  id: string;
  userId: string;
  dob: string;
  gender: Gender;
  bloodGroup?: string;
  address: string;
  emergencyContact: string;
}

interface ProfileData {
  user: UserData;
  patientProfile?: PatientProfile;
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    dob: "",
    gender: "" as Gender | "",
    bloodGroup: "",
    address: "",
    emergencyContact: "",
  });

  // Fetch profile data directly from API (middleware handles auth)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/profile", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
          // Initialize form data
          setFormData({
            name: data.user?.name || "",
            phone: data.user?.phone || "",
            dob: data.patientProfile?.dob
              ? new Date(data.patientProfile.dob).toISOString().split("T")[0]
              : "",
            gender: data.patientProfile?.gender || "",
            bloodGroup: data.patientProfile?.bloodGroup || "",
            address: data.patientProfile?.address || "",
            emergencyContact: data.patientProfile?.emergencyContact || "",
          });
        } else if (response.status === 401) {
          // Unauthorized - let middleware handle redirect
          router.push("/login");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    // Fetch immediately - don't wait for session hook
    fetchProfile();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
        setEditing(false);
        toast.success("Profile updated successfully");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original data
    if (profileData) {
      setFormData({
        name: profileData.user?.name || "",
        phone: profileData.user?.phone || "",
        dob: profileData.patientProfile?.dob
          ? new Date(profileData.patientProfile.dob).toISOString().split("T")[0]
          : "",
        gender: profileData.patientProfile?.gender || "",
        bloodGroup: profileData.patientProfile?.bloodGroup || "",
        address: profileData.patientProfile?.address || "",
        emergencyContact: profileData.patientProfile?.emergencyContact || "",
      });
    }
    setEditing(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getGenderLabel = (gender?: Gender | "") => {
    if (!gender) return "Not set";
    return gender.charAt(0) + gender.slice(1).toLowerCase();
  };

  if (loading) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const user = profileData?.user;
  const patientProfile = profileData?.patientProfile;
  const displayName = user?.name || session?.user?.name || "User";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading text-foreground">My Profile</h1>
          <p className="text-muted-foreground mt-1">
            Manage your personal information and settings
          </p>
        </div>
        {!editing ? (
          <Button onClick={() => setEditing(true)} className="gap-2">
            <Edit2 size={16} />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
              className="gap-2"
            >
              <X size={16} />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Save Changes
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={user?.image || undefined} />
                <AvatarFallback className="bg-white text-primary border border-border text-2xl">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold text-foreground">
                {displayName}
              </h2>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
              <div className="flex gap-2 mt-3">
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary"
                >
                  {user?.role || "PATIENT"}
                </Badge>
                {user?.emailVerified && (
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-700"
                  >
                    <Shield size={12} className="mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Member since {formatDate(user?.createdAt)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User size={20} />
              Personal Information
            </CardTitle>
            <CardDescription>
              Your basic personal details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                {editing ? (
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter your full name"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-foreground p-2 bg-accent/30 rounded-md">
                    <User size={16} className="text-muted-foreground" />
                    {user?.name || "Not set"}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="flex items-center gap-2 text-foreground p-2 bg-accent/30 rounded-md">
                  <Mail size={16} className="text-muted-foreground" />
                  {user?.email}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                {editing ? (
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-foreground p-2 bg-accent/30 rounded-md">
                    <Phone size={16} className="text-muted-foreground" />
                    {user?.phone || "Not set"}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                {editing ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.dob && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.dob
                          ? format(new Date(formData.dob), "PPP")
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          formData.dob ? new Date(formData.dob) : undefined
                        }
                        onSelect={(date) =>
                          setFormData({
                            ...formData,
                            dob: date ? format(date, "yyyy-MM-dd") : "",
                          })
                        }
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        captionLayout="dropdown"
                        fromYear={1900}
                        toYear={new Date().getFullYear()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                ) : (
                  <div className="flex items-center gap-2 text-foreground p-2 bg-accent/30 rounded-md">
                    <CalendarIcon size={16} className="text-muted-foreground" />
                    {formatDate(patientProfile?.dob)}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                {editing ? (
                  <Select
                    value={formData.gender}
                    onValueChange={(value) =>
                      setFormData({ ...formData, gender: value as Gender })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2 text-foreground p-2 bg-accent/30 rounded-md">
                    <User size={16} className="text-muted-foreground" />
                    {getGenderLabel(patientProfile?.gender)}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bloodGroup">Blood Group</Label>
                {editing ? (
                  <Select
                    value={formData.bloodGroup}
                    onValueChange={(value) =>
                      setFormData({ ...formData, bloodGroup: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2 text-foreground p-2 bg-accent/30 rounded-md">
                    <Heart size={16} className="text-muted-foreground" />
                    {patientProfile?.bloodGroup || "Not set"}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              {editing ? (
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Enter your address"
                />
              ) : (
                <div className="flex items-center gap-2 text-foreground p-2 bg-accent/30 rounded-md">
                  <MapPin size={16} className="text-muted-foreground" />
                  {patientProfile?.address || "Not set"}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyContact">Emergency Contact</Label>
              {editing ? (
                <Input
                  id="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContact: e.target.value,
                    })
                  }
                  placeholder="Emergency contact name and phone"
                />
              ) : (
                <div className="flex items-center gap-2 text-foreground p-2 bg-accent/30 rounded-md">
                  <Phone size={16} className="text-muted-foreground" />
                  {patientProfile?.emergencyContact || "Not set"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield size={20} />
            Account Security
          </CardTitle>
          <CardDescription>
            Manage your account security and verification status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 bg-accent/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Mail size={16} className="text-primary" />
                <span className="text-sm font-medium">Email Verification</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {user?.emailVerified ? (
                  <span className="text-green-600">✓ Email verified</span>
                ) : (
                  <span className="text-amber-600">⚠ Email not verified</span>
                )}
              </p>
            </div>

            <div className="p-4 bg-accent/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Phone size={16} className="text-primary" />
                <span className="text-sm font-medium">Phone Number</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {user?.phone ? (
                  <span className="text-green-600">✓ Phone added</span>
                ) : (
                  <span className="text-amber-600">⚠ Phone not added</span>
                )}
              </p>
            </div>

            <div className="p-4 bg-accent/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={16} className="text-primary" />
                <span className="text-sm font-medium">Account Type</span>
              </div>
              <p className="text-sm text-muted-foreground capitalize">
                {user?.role?.toLowerCase() || "Patient"} Account
              </p>
            </div>

            <div className="p-4 bg-accent/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">Share Afiya</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Share this app with friends and family
              </p>
              <ShareApp size="sm" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
