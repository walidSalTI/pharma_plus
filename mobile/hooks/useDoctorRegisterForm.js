import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { useToast } from "@/src/context/ToastContext";
import { registerDoctor } from "@/services/doctorAuthService";
import { setPendingVerifyEmail } from "@/services/tokenService";

const SPECIALIZATIONS = [
  "Cardiology",
  "Dermatology",
  "General Practice",
  "Internal Medicine",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "Surgery",
  "Oncology",
  "Psychiatry",
  "Urology",
  "Ophthalmology",
  "ENT",
  "Gastroenterology",
  "Pulmonology",
];

const WORKPLACE_TYPES = ["Clinic", "Hospital"];

export const useDoctorRegisterForm = () => {
  const router = useRouter();
  const { error: toastError } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    f_name: "",
    l_name: "",
    email: "",
    password: "",
    password_confirmation: "",
    phone_number: "",
    age: "",
    gender: "",
    location: "",
    specialization: "",
  });

  const [syndicateImage, setSyndicateImage] = useState(null);
  const [workplaces, setWorkplaces] = useState([]);
  const [currentWorkplace, setCurrentWorkplace] = useState({
    place_name: "",
    place_type: "",
    latitude: "",
    longitude: "",
    radius_meters: "50",
  });

  const [errors, setErrors] = useState({});
  const [genderModal, setGenderModal] = useState(false);
  const [specializationModal, setSpecializationModal] = useState(false);
  const [workplaceTypeModal, setWorkplaceTypeModal] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  useEffect(() => {
    (async () => {
      setLocationLoading(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationLoading(false);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        const addresses = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (addresses && addresses.length > 0) {
          const addr = addresses[0];
          const parts = [addr.city, addr.region, addr.country].filter(Boolean);
          if (parts.length > 0) {
            updateField("location", parts.join(", "));
          }
        }
      } catch {
      } finally {
        setLocationLoading(false);
      }
    })();
  }, []);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const updateWorkplaceField = (key, value) => {
    setCurrentWorkplace((prev) => ({ ...prev, [key]: value }));
  };

  const setSyndicateImageManual = (uri) => {
    if (uri) {
      setSyndicateImage({ uri });
    }
  };

  const addWorkplace = () => {
    if (!currentWorkplace.place_name.trim()) {
      toastError("Workplace name is required");
      return;
    }
    if (!currentWorkplace.place_type) {
      toastError("Workplace type is required");
      return;
    }
    if (!currentWorkplace.latitude || !currentWorkplace.longitude) {
      toastError("Location coordinates are required");
      return;
    }
    setWorkplaces((prev) => [...prev, { ...currentWorkplace }]);
    setCurrentWorkplace({
      place_name: "",
      place_type: "",
      latitude: "",
      longitude: "",
      radius_meters: "50",
    });
  };

  const removeWorkplace = (index) => {
    setWorkplaces((prev) => prev.filter((_, i) => i !== index));
  };

  const setWorkplaceLocation = (latitude, longitude) => {
    setCurrentWorkplace((prev) => ({
      ...prev,
      latitude: String(latitude),
      longitude: String(longitude),
    }));
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!form.f_name.trim()) newErrors.f_name = "First name is required";
    if (!form.l_name.trim()) newErrors.l_name = "Last name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    if (!form.password || form.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";
    if (form.password !== form.password_confirmation)
      newErrors.password_confirmation = "Passwords do not match";
    if (!form.phone_number.trim()) newErrors.phone_number = "Phone is required";
    if (!form.age || isNaN(form.age)) newErrors.age = "Enter a valid age";
    if (!form.gender) newErrors.gender = "Gender is required";
    if (!form.specialization) newErrors.specialization = "Specialization is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    if (!syndicateImage) {
      toastError("Please upload your syndicate card image");
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const submitRegistration = async () => {
    if (workplaces.length === 0) {
      toastError("Please add at least one workplace");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("f_name", form.f_name.trim());
      fd.append("l_name", form.l_name.trim());
      fd.append("email", form.email.trim());
      fd.append("password", form.password);
      fd.append("password_confirmation", form.password_confirmation);
      fd.append("phone_number", form.phone_number.trim());
      fd.append("age", form.age);
      fd.append("gender", form.gender.toLowerCase());
      fd.append("location", form.location.trim());
      fd.append("specialization", form.specialization);

      if (syndicateImage && syndicateImage.uri) {
        const filename = syndicateImage.uri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";
        fd.append("syndicate_card_image", {
          uri: syndicateImage.uri,
          name: filename,
          type,
        });
      }

      workplaces.forEach((wp, i) => {
        fd.append(`workplaces[${i}][place_name]`, wp.place_name);
        fd.append(`workplaces[${i}][place_type]`, wp.place_type.toLowerCase());
        fd.append(`workplaces[${i}][latitude]`, wp.latitude);
        fd.append(`workplaces[${i}][longitude]`, wp.longitude);
        fd.append(`workplaces[${i}][radius_meters]`, wp.radius_meters);
      });

      const response = await registerDoctor(fd);
      await setPendingVerifyEmail(form.email, "doctor");
      router.replace("/(auth-doctor)/EmailVerifyScreen");
    } catch (error) {
      const message = error.message || "Registration failed.";
      toastError(message);
    } finally {
      setLoading(false);
    }
  };

  return {
    currentStep,
    loading,
    form,
    updateField,
    syndicateImage,
    setSyndicateImage: setSyndicateImageManual,
    workplaces,
    currentWorkplace,
    updateWorkplaceField,
    addWorkplace,
    removeWorkplace,
    setWorkplaceLocation,
    showLocationPicker,
    setShowLocationPicker,
    locationLoading,
    genderModal,
    setGenderModal,
    specializationModal,
    setSpecializationModal,
    workplaceTypeModal,
    setWorkplaceTypeModal,
    errors,
    nextStep,
    prevStep,
    submitRegistration,
    SPECIALIZATIONS,
    WORKPLACE_TYPES,
  };
};
