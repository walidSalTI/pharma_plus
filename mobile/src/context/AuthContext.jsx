import { createContext, useContext, useEffect, useMemo, useCallback, useState } from "react";
import { getStoredToken, getUserRole } from "@/services/tokenService";
import { registerUnauthorizedHandler } from "@/services/authEvents";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [status, setStatus] = useState("loading");
  const [role, setRole] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getStoredToken();
        if (cancelled) return;
        if (!token) {
          setStatus("guest");
          return;
        }
        const storedRole = await getUserRole();
        if (cancelled) return;
        setRole(storedRole || "patient");
        setStatus("authed");
      } catch {
        if (!cancelled) setStatus("guest");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback((nextRole) => {
    setRole(nextRole || "patient");
    setStatus("authed");
  }, []);

  const signOut = useCallback(() => {
    setRole(null);
    setStatus("guest");
  }, []);

  useEffect(() => {
    return registerUnauthorizedHandler(() => {
      signOut();
    });
  }, [signOut]);

  const value = useMemo(
    () => ({ status, role, signIn, signOut }),
    [status, role, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
