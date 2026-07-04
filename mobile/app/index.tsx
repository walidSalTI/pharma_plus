import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { getStoredToken } from "@/services/tokenService";

export default function Index() {
  const [authState, setAuthState] = useState("loading");

  useEffect(() => {
    (async () => {
      const token = await getStoredToken();
      setAuthState(token ? "authenticated" : "guest");
    })();
  }, []);

  if (authState === "loading") return null;

  if (authState === "authenticated") {
    return <Redirect href="/(patient)/MedicationsScreen" />;
  }

  return <Redirect href="/LoginScreen" />;
}
