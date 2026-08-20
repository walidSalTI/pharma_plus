import { useState, useEffect, useRef, useCallback } from "react";
import { AppState } from "react-native";
import { getSecretKey, getTotpPayload } from "@/services/totpService";
import { getStoredToken } from "@/services/tokenService";

const ROTATION_INTERVAL = 30;

export const useTotpQr = (doctorId) => {
  const [payload, setPayload] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(ROTATION_INTERVAL);
  const [isActive, setIsActive] = useState(false);
  const [secretReady, setSecretReady] = useState(false);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const secretRef = useRef(null);
  const refreshCounter = useRef(0);

  const generateCode = useCallback(() => {
    if (!secretRef.current || !doctorId) return;
    try {
      const newPayload = getTotpPayload(doctorId, secretRef.current);
      setPayload(newPayload);
      setTimeRemaining(ROTATION_INTERVAL);
    } catch (err) {
      console.warn("[TOTP] Error generating code:", err.message);
    }
  }, [doctorId]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    generateCode();
    setIsActive(true);

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          generateCode();
          return ROTATION_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);
  }, [generateCode]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsActive(false);
    setPayload(null);
  }, []);

  const initSecret = useCallback(async (forceRefresh = false) => {
    setError(null);
    const token = await getStoredToken();
    if (!token || !doctorId) return;

    try {
      const secret = await getSecretKey({ forceRefresh });
      if (secret) {
        secretRef.current = secret;
        setSecretReady(true);
        startTimer();
      } else {
        setError("Failed to fetch secret key. Please check your connection and try again.");
      }
    } catch (err) {
      console.warn("[TOTP] Error initializing QR:", err.message);
      setError(err.message || "Failed to initialize QR code.");
    }
  }, [doctorId, startTimer]);

  const refresh = useCallback(async () => {
    stopTimer();
    secretRef.current = null;
    setSecretReady(false);
    refreshCounter.current += 1;
    await initSecret(true);
  }, [stopTimer, initSecret]);

  useEffect(() => {
    initSecret(false);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [doctorId, initSecret]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (appState.current.match(/active/) && nextState.match(/inactive|background/)) {
        stopTimer();
      } else if (appState.current.match(/inactive|background/) && nextState === "active") {
        if (secretRef.current && doctorId) {
          startTimer();
        }
      }
      appState.current = nextState;
    });

    return () => subscription?.remove();
  }, [doctorId, startTimer, stopTimer]);

  return { payload, timeRemaining, isActive, secretReady, error, refresh };
};
