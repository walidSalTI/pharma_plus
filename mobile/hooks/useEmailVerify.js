import { useState, useRef, useEffect } from "react";
import { useRouter } from "expo-router";
import { useToast } from "@/src/context/ToastContext";
import {
  sendVerificationEmail,
  verifyEmailCode,
} from "@/services/authService";
import {
  sendVerificationEmail as sendVerificationEmailDoctor,
  verifyEmailCode as verifyEmailCodeDoctor,
} from "@/services/doctorAuthService";
import {
  sendVerificationEmail as sendVerificationEmailRep,
  verifyEmailCode as verifyEmailCodeRep,
} from "@/services/repAuthService";
import {
  setPendingVerifyEmail,
  getPendingVerifyEmail,
  getPendingVerifyRole,
  clearPendingVerify,
  getUserRole,
} from "@/services/tokenService";
import { useAuth } from "@/src/context/AuthContext";

export const useEmailVerify = () => {
  const router = useRouter();
  const { error: toastError, success: toastSuccess } = useToast();
  const { signIn } = useAuth();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [email, setEmailState] = useState("");
  const [role, setRole] = useState("patient");
  const inputRefs = useRef([]);

  useEffect(() => {
    (async () => {
      const storedEmail = await getPendingVerifyEmail();
      const storedRole = await getPendingVerifyRole();
      if (storedEmail) setEmailState(storedEmail);
      if (storedRole) setRole(storedRole);
      else {
        try {
          const r = await getUserRole();
          if (r) setRole(r);
        } catch {}
      }
    })();
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => setResendTimer((p) => p - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  const getVerifyFns = (role) => {
    switch (role) {
      case "doctor":
        return { send: sendVerificationEmailDoctor, verify: verifyEmailCodeDoctor };
      case "rep":
        return { send: sendVerificationEmailRep, verify: verifyEmailCodeRep };
      default:
        return { send: sendVerificationEmail, verify: verifyEmailCode };
    }
  };

  const handleDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    setError("");
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (newDigits.every((d) => d !== "")) {
      handleSubmit(newDigits.join(""));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.nativeEvent.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (code) => {
    setLoading(true);
    setError("");
    try {
      const { verify } = getVerifyFns(role);
      await verify(email, code);
      await clearPendingVerify();
      toastSuccess("Email verified successfully!");
      const currentRole = await getUserRole();
      if (currentRole === "doctor") {
        signIn("doctor");
        router.replace("/(doctor)/DoctorDashboard");
      } else if (currentRole === "rep") {
        signIn("rep");
        router.replace("/(rep)/RepDashboard");
      } else {
        signIn("patient");
        router.replace("/(patient)/MedicationsScreen");
      }
    } catch (err) {
      const message = err.message || "Invalid or expired code.";
      setError(message);
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      const { send } = getVerifyFns(role);
      await send(email);
      setResendTimer(60);
    } catch (err) {
      toastError(err.message || "Failed to resend code");
    } finally {
      setResendLoading(false);
    }
  };

  const handleCancel = async () => {
    await clearPendingVerify();
    const currentRole = await getUserRole();
    if (currentRole === "doctor") router.replace("/(auth-doctor)/DoctorLoginScreen");
    else if (currentRole === "rep") router.replace("/(auth-rep)/RepLoginScreen");
    else router.replace("/(auth)/LoginScreen");
  };

  return {
    digits,
    setDigits,
    loading,
    resendLoading,
    error,
    resendTimer,
    email,
    role,
    inputRefs,
    handleDigitChange,
    handleKeyDown,
    handleResend,
    handleCancel,
  };
};
