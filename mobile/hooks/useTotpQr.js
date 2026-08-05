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

  const generateCode = useCallback(() => {
    if (!secretRef.current || !doctorId) return;
    const newPayload = getTotpPayload(doctorId, secretRef.current);
    setPayload(newPayload);
    setTimeRemaining(ROTATION_INTERVAL);
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

  useEffect(() => {
    (async () => {
      setError(null);
      const token = await getStoredToken();
      if (!token || !doctorId) return;

      try {
        const secret = await getSecretKey();
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
    })();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [doctorId]);

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

  return { payload, timeRemaining, isActive, secretReady, error };
};
