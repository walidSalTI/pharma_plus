import { useState, useEffect } from "react";
import { getProfile } from "@/services/profileService";
import { getUserName, setUserName } from "@/services/tokenService";

export const useUserName = () => {
  const [userName, setUserNameState] = useState("");
  const [lName, setLNameState] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await getUserName();
        if (cancelled) return;
        if (stored) {
          setUserNameState(stored);
          try {
            const data = await getProfile();
            if (!cancelled) setLNameState(data.l_name || data.last_name || "");
          } catch {}
          setLoading(false);
          return;
        }
        const data = await getProfile();
        if (cancelled) return;
        const name = data.f_name || data.first_name || "";
        const last = data.l_name || data.last_name || "";
        if (name) await setUserName(name);
        setUserNameState(name);
        setLNameState(last);
      } catch {
        if (!cancelled) setUserNameState("");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { userName, lName, loading };
};
