import { useState, useEffect, useCallback } from "react";
import { getDoctorProfile } from "@/services/doctorService";

export const useDoctorProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getDoctorProfile();
      setProfile(data);
    } catch {
      setError(true);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return { profile, loading, error, reload: loadProfile };
};
