import { useState, useEffect } from "react";
import { getProfile } from "@/services/profileService";

let cachedName = null;

export const useUserName = () => {
  const [userName, setUserName] = useState(cachedName || "");
  const [loading, setLoading] = useState(!cachedName);

  useEffect(() => {
    if (cachedName) {
      setUserName(cachedName);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await getProfile();
        if (cancelled) return;
        const name = data.f_name || data.first_name || "";
        cachedName = name;
        setUserName(name);
      } catch {
        if (!cancelled) setUserName("");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { userName, loading };
};