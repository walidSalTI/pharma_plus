import { useState } from "react";
import { useRouter } from "expo-router";
import { useToast } from "@/src/context/ToastContext";
import { loginDoctor } from "@/services/doctorAuthService";
import { setToken, setUserRole, setPending2FA } from "@/services/tokenService";
import { useAuth } from "@/src/context/AuthContext";

export const useDoctorLoginForm = () => {
  const router = useRouter();
  const { error: toastError } = useToast();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = "Email is required";
    }
    if (!password) {
      newErrors.password = "Password is required";
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
    setEmail,
    password,
    setPassword,
    isLoading,
    showPassword,
    setShowPassword,
    errors,
    handleLogin,
  };
};
