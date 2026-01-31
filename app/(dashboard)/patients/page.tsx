"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Calendar,
  Phone,
  Mail,
  ChevronRight,
  Loader2,
  User as UserIcon,
  Heart,
  BriefcaseMedical,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Patient {
  id: string;
  name: string;
  email: string;
  phone?: string;
  image?: string;
  bloodGroup?: string;
  gender: string;
  lastVisit: string | null;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await fetch("/api/patients", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setPatients(data.patients);
          setFilteredPatients(data.patients);
        }
      } catch (error) {
        console.error("Error fetching patients:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredPatients(patients);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = patients.filter(
        (patient) =>
          patient.name.toLowerCase().includes(query) ||
          patient.email.toLowerCase().includes(query) ||
          patient.phone?.toLowerCase().includes(query),
      );
      setFilteredPatients(filtered);
    }
  }, [searchQuery, patients]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No visits yet";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Card className="border-border">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="font-heading text-2xl flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                My Patients
              </CardTitle>
              <CardDescription>
                View and manage your patient records
              </CardDescription>
            </div>
            <Badge variant="outline" className="w-fit">
              {filteredPatients.length} Patient
              {filteredPatients.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="py-12 text-center">
              <UserIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                {searchQuery
                  ? "No patients found matching your search"
                  : "No patients found. Patients will appear here after their first appointment."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPatients.map((patient) => (
                <Link
                  key={patient.id}
                  href={`/patients/${patient.id}`}
                  className="group relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-white to-gray-50/50 p-5 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
                >
                  {/* Decorative gradient overlay */}
                  <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-2xl -z-0" />

                  <div className="relative z-10">
                    {/* Header with Avatar and Arrow */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-14 w-14 border-2 border-primary/10 shadow-sm">
                          {patient.image ? (
                            <AvatarImage src={patient.image} />
                          ) : null}
                          <AvatarFallback className="  text-black font-semibold text-lg">
                            {getInitials(patient.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate text-base mb-1">
                            {patient.name}
                          </p>
                          <div className="flex items-center gap-1.5">
                            {patient.bloodGroup && (
                              <Badge
                                variant="outline"
                                className="text-xs px-2 py-0.5 bg-red-50 border-red-200 text-gray-600"
                              >
                                <BriefcaseMedical className="h-3 w-3 mr-1 text-gray-800" />
                                {patient.bloodGroup}
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className="text-xs px-2 py-0.5 bg-blue-50 border-blue-200 text-blue-700 capitalize"
                            >
                              {patient.gender.toLowerCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-white">
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2.5">
                      {patient.email && (
                        <div className="flex items-center gap-2.5 text-sm">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="truncate text-gray-600">
                            {patient.email}
                          </span>
                        </div>
                      )}
                      {patient.phone && (
                        <div className="flex items-center gap-2.5 text-sm">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">{patient.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Last Visit */}
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-500">Last visit:</span>
                        <span className="font-medium text-gray-700">
                          {formatDate(patient.lastVisit)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
