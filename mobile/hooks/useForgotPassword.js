import { useState } from "react";
import { useRouter } from "expo-router";
import { useToast } from "@/src/context/ToastContext";
import { forgotPassword, resetPassword } from "@/services/authService";
import {
  setPendingResetEmail,
  getPendingResetEmail,
  clearPendingResetEmail,
} from "@/services/tokenService";

export const useForgotPassword = () => {
  const router = useRouter();
  const { error: toastError, success: toastSuccess } = useToast();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateEmail = () => {
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setErrors({ email: "Please enter a valid email" });
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSendCode = async () => {
    if (!validateEmail()) return;
    setIsLoading(true);
    try {
      await forgotPassword(email);
      await setPendingResetEmail(email);
      setStep(2);
    } catch (err) {
      toastError(err.message || "Failed to send reset code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const codeStr = code.join("");
    if (codeStr.length !== 6) {
      setErrors({ code: "Please enter the 6-digit code" });
      return;
    }
    if (!password || password.length < 8) {
      setErrors({ password: "Password must be at least 8 characters" });
      return;
    }
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" });
      return;
    }
    setErrors({});
    setIsLoading(true);
    try {
      const storedEmail = await getPendingResetEmail();
      const resetEmail = storedEmail || email;
      await resetPassword(resetEmail, codeStr, password, confirmPassword);
      await clearPendingResetEmail();
      toastSuccess("Password reset successfully!");
      router.replace("/(auth)/LoginScreen");
    } catch (err) {
      toastError(err.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    setEmail,
    code,
    setCode,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    step,
    setStep,
    isLoading,
    errors,
    handleSendCode,
    handleResetPassword,
  };
};
