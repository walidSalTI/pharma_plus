import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { useToast } from "@/src/context/ToastContext";
import { loginDoctor } from "@/services/doctorAuthService";
import { setToken, setUserRole, setPending2FA } from "@/services/tokenService";
import { useAuth } from "@/src/context/AuthContext";
import { isMockLoginEnabled, isConnectionError } from "@/services/devMocks";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const useDoctorLoginForm = () => {
  const router = useRouter();
  const { error: toastError } = useToast();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const clearError = useCallback((field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleEmailChange = useCallback((value) => {
    setEmail(value);
    clearError("email");
  }, [clearError]);

  const handlePasswordChange = useCallback((value) => {
    setPassword(value);
    clearError("password");
  }, [clearError]);

  const validateForm = () => {
    const newErrors = {};
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      newErrors.email = "Email is required";
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      newErrors.email = "Enter a valid email address";
    }
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await loginDoctor(email, password);

      if (response.two_factor) {
        await setPending2FA(response.two_factor_token, "doctor");
        router.push("/(auth-doctor)/TwoFactorVerifyScreen");
        return;
      }

      if (response.data?.token) {
        await setToken(response.data.token);
        await setUserRole("doctor");
        signIn("doctor");
        router.replace("/(doctor)/DoctorDashboard");
      }
    } catch (error) {
      if (isMockLoginEnabled() && isConnectionError(error)) {
        await setToken("mock-session");
        await setUserRole("doctor");
        signIn("doctor");
        router.replace("/(doctor)/DoctorDashboard");
        return;
      }
      const message =
        error.message?.includes("401") || error.message?.includes("credentials")
          ? "Invalid email or password"
          : error.message || "Login failed. Please try again.";
      toastError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    setEmail: handleEmailChange,
    password,
    setPassword: handlePasswordChange,
    isLoading,
    showPassword,
    setShowPassword,
    errors,
    handleLogin,
  };
};
