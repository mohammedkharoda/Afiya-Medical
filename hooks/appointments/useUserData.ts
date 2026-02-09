import { useState, useEffect } from "react";
import { UserData, DoctorProfile } from "@/components/appointments/types";

export function useUserData() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/user/me", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setUserData(data.user);
          // Set doctor profile if available (for doctors)
          if (data.doctorProfile) {
            setDoctorProfile(data.doctorProfile);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const isDoctor = userData?.role === "DOCTOR";

  return {
    userData,
    doctorProfile,
    loading,
    isDoctor,
  };
}
