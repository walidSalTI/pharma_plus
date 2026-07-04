import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { registerUser } from "@/services/authService";

export const useRegisterForm = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    f_name: "",
    l_name: "",
    age: "",
    phone_number: "",
    location: "",
    email: "",
    password: "",
    password_confirmation: "",
    latitude: null,
    longitude: null,
  });

  const [gender, setGender] = useState("");
  const [bloodType, setBloodType] = useState("");

  const [genderModal, setGenderModal] = useState(false);
  const [bloodModal, setBloodModal] = useState(false);

  const [errors, setErrors] = useState({});

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.f_name.trim()) newErrors.f_name = "First name is required";
    if (!form.l_name.trim()) newErrors.l_name = "Last name is required";
    if (!form.age || isNaN(form.age)) newErrors.age = "Enter a valid age";
    if (!form.phone_number.trim()) newErrors.phone_number = "Phone is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    if (!form.password || form.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";
    if (form.password !== form.password_confirmation)
      newErrors.password_confirmation = "Passwords do not match";
    if (!gender) newErrors.gender = "Gender is required";
    if (!bloodType) newErrors.bloodType = "Blood type is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        ...form,
        age: parseInt(form.age, 10),
        latitude: form.latitude ? parseFloat(form.latitude) : undefined,
        longitude: form.longitude ? parseFloat(form.longitude) : undefined,
        gender,
        blood_type: bloodType,
        password_confirmation: form.password,
      };

      const response = await registerUser(payload);
      if (response.data?.token) {
        router.replace("/");
      }
    } catch (error) {
      const message =
        error.message?.includes("409")
          ? "Email already exists"
          : error.message || "Registration failed.";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    form,
    setForm,
    updateField,
    gender,
    setGender,
    bloodType,
    setBloodType,
    genderModal,
    setGenderModal,
    bloodModal,
    setBloodModal,
    errors,
    handleRegister,
  };
};
