import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import tw from "twrnc";
import { CustomSelect, InputField } from "@/components/FormInputs";
import LocationPickerModal from "@/components/LocationPickerModal";
import WorkplaceCard from "@/components/WorkplaceCard";
import { logoutDoctor } from "@/services/doctorAuthService";
import { clearToken } from "@/services/tokenService";
import { clearAllReminders } from "@/services/reminderCleanup";
import { updateDoctorProfile, getDoctorWorkplaces, addWorkplace as addWorkplaceApi, updateWorkplace as updateWorkplaceApi, deleteWorkplace as deleteWorkplaceApi } from "@/services/doctorService";
import { useDoctorProfile } from "@/hooks/useDoctorProfile";
import DoctorBottomNavBar from "@/components/DoctorBottomNavBar";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useToast } from "@/src/context/ToastContext";
import { useCustomAlert } from "@/src/context/CustomAlertContext";
import { useAuth } from "@/src/context/AuthContext";
import ErrorState from "@/components/ErrorState";
import { webShadow } from "@/constants/shadow";
import { useResponsive } from "@/constants/responsive";
export default function DoctorProfileScreen() {
  const router = useRouter();
  const { t, language, toggleLanguage } = useLanguage();
  const { theme, isDark, toggleTheme } = useAppTheme();
  const { hs, vs, fontScale, isTablet } = useResponsive();
  const { profile, loading, error, reload } = useDoctorProfile();
  const { success: toastSuccess, error: toastError } = useToast();
  const { confirm } = useCustomAlert();
  const { signOut } = useAuth();

  const WORKPLACE_TYPES = ["Clinic", "Hospital"];

  const [saving, setSaving] = useState(false);
  const [fName, setFName] = useState("");
  const [lName, setLName] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [workplaces, setWorkplaces] = useState([]);
  const [showAddWorkplace, setShowAddWorkplace] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [workplaceTypeModal, setWorkplaceTypeModal] = useState(false);
  const [editingWorkplace, setEditingWorkplace] = useState(null);
  const [newWorkplace, setNewWorkplace] = useState({
    place_name: "",
    place_type: "",
    latitude: "",
    longitude: "",
    radius_meters: "50",
  });
  const loadWorkplaces = async () => {
    try {
      const data = await getDoctorWorkplaces();
      setWorkplaces(Array.isArray(data) ? data : data?.data || []);
    } catch {
      setWorkplaces([]);
    }
  };

  const initProfile = useCallback(() => {
    if (profile && !initialized) {
      setFName(profile.f_name || "");
      setLName(profile.l_name || "");
      setInitialized(true);
      loadWorkplaces();
    }
  }, [profile, initialized]);

  useEffect(() => {
    if (profile && !initialized) {
      initProfile();
    }
  }, [profile, initialized, initProfile]);

  const handleSave = async () => {
    if (!fName.trim() || !lName.trim()) {
      toastError(t("fNameRequired"));
      return;
    }
    setSaving(true);
    try {
      await updateDoctorProfile({ f_name: fName.trim(), l_name: lName.trim() });
      toastSuccess(t("profileSaved"));
    } catch (e) {
      toastError(e.message || t("failedUpdate"));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    confirm({
      title: t("logout"),
      message: t("logoutConfirm"),
      confirmText: t("logout"),
      cancelText: t("cancel"),
      variant: "logout",
      onConfirm: async () => {
        try {
          await logoutDoctor();
        } catch {}
        await clearAllReminders();
        await clearToken();
        signOut();
        router.replace("/");
      },
    });
  };

  const handleDeleteWorkplace = (wp) => {
    confirm({
      title: t("delete"),
      message: t("deleteWorkplaceConfirm"),
      confirmText: t("delete"),
      cancelText: t("cancel"),
      variant: "delete",
      onConfirm: async () => {
        try {
          await deleteWorkplaceApi(wp.id);
          loadWorkplaces();
        } catch (e) {
          toastError(e.message);
        }
      },
    });
  };

  const handleAddWorkplace = async () => {
    if (!newWorkplace.place_name.trim()) {
      toastError(t("workplaceNameRequired"));
      return;
    }
    if (!newWorkplace.place_type) {
      toastError(t("workplaceTypeRequired"));
      return;
    }
    try {
      if (editingWorkplace) {
        await updateWorkplaceApi(editingWorkplace.id, {
          ...newWorkplace,
          place_type: newWorkplace.place_type.toLowerCase(),
        });
      } else {
        await addWorkplaceApi({
          ...newWorkplace,
          place_type: newWorkplace.place_type.toLowerCase(),
        });
      }
      setShowAddWorkplace(false);
      setEditingWorkplace(null);
      setNewWorkplace({ place_name: "", place_type: "", latitude: "", longitude: "", radius_meters: "50" });
      loadWorkplaces();
    } catch (e) {
      toastError(e.message);
    }
  };

  const handleEditWorkplace = (wp) => {
    setEditingWorkplace(wp);
    setNewWorkplace({
      place_name: wp.place_name || "",
      place_type: wp.place_type ? wp.place_type.charAt(0).toUpperCase() + wp.place_type.slice(1) : "",
      latitude: wp.latitude || "",
      longitude: wp.longitude || "",
      radius_meters: String(wp.radius_meters || "50"),
    });
    setShowAddWorkplace(true);
  };

  const handleCloseWorkplaceModal = () => {
    setShowAddWorkplace(false);
    setEditingWorkplace(null);
    setNewWorkplace({ place_name: "", place_type: "", latitude: "", longitude: "", radius_meters: "50" });
  };

  if (loading) {
    return (
      <View style={[tw`flex-1 items-center justify-center`, { backgroundColor: theme.surface }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (error && !profile) {
    return (
      <View style={[tw`flex-1 justify-center`, { backgroundColor: theme.surface }]}>
        <ErrorState message={t("couldNotLoad")} onRetry={reload} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: theme.surface }]}>
      <View style={[{ flexDirection: "row", alignItems: "center", paddingHorizontal: hs(24), height: vs(64), borderBottomWidth: 1, borderBottomColor: theme.outlineVariant }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[{ width: hs(40), height: hs(40), borderRadius: hs(20), alignItems: "center", justifyContent: "center" }, { backgroundColor: theme.surfaceContainerLow }]}
        >
          <MaterialCommunityIcons name="arrow-left" size={hs(22)} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[{ fontSize: fontScale(20), fontWeight: "700", marginLeft: hs(16) }, { color: theme.onSurface }]}>
          {t("doctorProfile")}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: vs(192) }}>
        <View style={{ alignItems: "center", paddingTop: vs(32), paddingBottom: vs(24) }}>
          <View style={[{ width: hs(80), height: hs(80), borderRadius: hs(40), alignItems: "center", justifyContent: "center" }, { backgroundColor: theme.primaryContainer }]}>
            <Text style={[{ fontSize: fontScale(30), fontWeight: "700" }, { color: theme.primary }]}>
              {fName.charAt(0).toUpperCase()}{lName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[{ fontSize: fontScale(20), fontWeight: "700", marginTop: vs(12) }, { color: theme.onSurface }]}>
            Dr. {fName} {lName}
          </Text>
          <Text style={[{ fontSize: fontScale(14) }, { color: theme.onSurfaceVariant }]}>
            {profile?.email}
          </Text>
          {profile?.specialization && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: vs(4) }}>
              <MaterialCommunityIcons name="stethoscope" size={hs(14)} color={theme.primary} />
              <Text style={{ fontSize: fontScale(13), color: theme.primary, fontWeight: "600" }}>
                {profile.specialization}
              </Text>
            </View>
          )}
        </View>

        <View style={{ paddingHorizontal: isTablet ? hs(120) : hs(24) }}>
          <Text style={[{ fontSize: fontScale(10), fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: vs(12) }, { color: theme.onSurfaceVariant }]}>
            {t("personalInfo")}
          </Text>
          <View style={[{ padding: hs(20), borderRadius: hs(32) }, { backgroundColor: theme.surfaceContainerLow }]}>
            <View style={{ flexDirection: "row", gap: hs(12) }}>
              <View style={{ flex: 1 }}>
                <InputField label={t("firstName")} icon="account-outline" value={fName} onChangeText={setFName} placeholder={t("firstNamePlaceholder")} />
              </View>
              <View style={{ flex: 1 }}>
                <InputField label={t("lastName")} icon="account-outline" value={lName} onChangeText={setLName} placeholder={t("lastNamePlaceholder")} />
              </View>
            </View>
            <InputField label={t("email")} icon="email-outline" value={profile?.email} editable={false} />
            <InputField label={t("phone")} icon="phone-outline" value={profile?.phone_number} editable={false} />
            <InputField label={t("specialization")} icon="stethoscope" value={profile?.specialization} editable={false} />
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={{
              paddingVertical: vs(16),
              borderRadius: hs(16),
              alignItems: "center",
              marginTop: vs(24),
              backgroundColor: theme.primary,
              opacity: saving ? 0.6 : 1,
              ...webShadow({ elevation: 6, color: theme.primary, radius: 12, offsetY: 6 }),
            }}
          >
            {saving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={[{ fontSize: fontScale(16), fontWeight: "700", color: "white" }]}>{t("saveChanges")}</Text>
            )}
          </TouchableOpacity>

          <View style={[{ height: 1, marginVertical: vs(32) }, { backgroundColor: theme.outlineVariant }]} />

          <Text style={[{ fontSize: fontScale(10), fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: vs(12) }, { color: theme.onSurfaceVariant }]}>
            {t("workplaces")}
          </Text>

          {workplaces.map((wp) => (
            <View key={wp.id} style={{ marginBottom: vs(12) }}>
              <WorkplaceCard workplace={wp} onEdit={handleEditWorkplace} onDelete={handleDeleteWorkplace} />
            </View>
          ))}

          <TouchableOpacity
            onPress={() => { setEditingWorkplace(null); setNewWorkplace({ place_name: "", place_type: "", latitude: "", longitude: "", radius_meters: "50" }); setShowAddWorkplace(true); }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: hs(8),
              paddingVertical: vs(16),
              borderRadius: hs(16),
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: theme.primary,
              marginTop: vs(8),
            }}
          >
            <MaterialCommunityIcons name="plus" size={hs(20)} color={theme.primary} />
            <Text style={{ fontSize: fontScale(14), fontWeight: "700", color: theme.primary }}>{t("addWorkplace")}</Text>
          </TouchableOpacity>

          <View style={[{ height: 1, marginVertical: vs(32) }, { backgroundColor: theme.outlineVariant }]} />

          <Text style={[{ fontSize: fontScale(10), fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: vs(12) }, { color: theme.onSurfaceVariant }]}>
            {t("verificationStatus")}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: hs(12),
              padding: hs(16),
              borderRadius: hs(16),
              backgroundColor: profile?.is_verified ? "#ecfdf5" : "#fffbeb",
            }}
          >
            <MaterialCommunityIcons
              name={profile?.is_verified ? "check-circle" : "clock-outline"}
              size={hs(24)}
              color={profile?.is_verified ? "#10b981" : "#f59e0b"}
            />
            <Text style={{ fontSize: fontScale(14), fontWeight: "600", color: profile?.is_verified ? "#059669" : "#d97706" }}>
              {profile?.is_verified ? t("approved") : t("pendingApproval")}
            </Text>
          </View>

          <View style={[{ height: 1, marginVertical: vs(32) }, { backgroundColor: theme.outlineVariant }]} />

          <Text style={[{ fontSize: fontScale(10), fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: vs(12) }, { color: theme.onSurfaceVariant }]}>
            {t("preferences")}
          </Text>

          <TouchableOpacity
            onPress={toggleTheme}
            style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: hs(16), borderRadius: hs(16), marginBottom: vs(12) }, { backgroundColor: theme.surfaceContainerLowest }]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: hs(12) }}>
              <MaterialCommunityIcons name={isDark ? "weather-night" : "white-balance-sunny"} size={hs(22)} color={theme.onSurfaceVariant} />
              <Text style={[{ fontSize: fontScale(16), fontWeight: "700" }, { color: theme.onSurface }]}>{isDark ? "Dark Mode" : "Light Mode"}</Text>
            </View>
            <View style={[{ width: hs(48), height: hs(24), borderRadius: hs(12), justifyContent: "center", paddingHorizontal: hs(4) }, { backgroundColor: isDark ? theme.primary : theme.outlineVariant }]}>
              <View style={[{ width: hs(16), height: hs(16), borderRadius: hs(8), backgroundColor: "white" }, { alignSelf: isDark ? "flex-end" : "flex-start" }]} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleLanguage}
            style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: hs(16), borderRadius: hs(16) }, { backgroundColor: theme.surfaceContainerLowest }]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: hs(12) }}>
              <MaterialCommunityIcons name="translate" size={hs(22)} color={theme.onSurfaceVariant} />
              <Text style={[{ fontSize: fontScale(16), fontWeight: "700" }, { color: theme.onSurface }]}>{t("language")}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: hs(4) }}>
              <View style={[{ paddingHorizontal: hs(16), paddingVertical: vs(6), borderRadius: hs(16) }, { backgroundColor: language === "en" ? theme.primary : theme.surfaceContainerLow }]}>
                <Text style={[{ fontSize: fontScale(12), fontWeight: "700" }, { color: language === "en" ? "white" : theme.onSurfaceVariant }]}>EN</Text>
              </View>
              <Text style={{ color: theme.outlineVariant }}>/</Text>
              <View style={[{ paddingHorizontal: hs(16), paddingVertical: vs(6), borderRadius: hs(16) }, { backgroundColor: language === "ar" ? theme.primary : theme.surfaceContainerLow }]}>
                <Text style={[{ fontSize: fontScale(12), fontWeight: "700" }, { color: language === "ar" ? "white" : theme.onSurfaceVariant }]}>AR</Text>
              </View>
            </View>
          </TouchableOpacity>

          <View style={[{ height: 1, marginVertical: vs(32) }, { backgroundColor: theme.outlineVariant }]} />

          <Text style={[{ fontSize: fontScale(10), fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: vs(12) }, { color: theme.onSurfaceVariant }]}>
            {t("security")}
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/(doctor)/TwoFactorSetupScreen")}
            style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: hs(16), borderRadius: hs(16) }, { backgroundColor: theme.surfaceContainerLowest }]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: hs(12) }}>
              <MaterialCommunityIcons name="shield-lock" size={hs(22)} color={theme.onSurfaceVariant} />
              <Text style={[{ fontSize: fontScale(16), fontWeight: "700" }, { color: theme.onSurface }]}>
                {t("twoFactorSettingsTitle")}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={hs(22)} color={theme.onSurfaceVariant} />
          </TouchableOpacity>

          <View style={[{ height: 1, marginVertical: vs(32) }, { backgroundColor: theme.outlineVariant }]} />

          <TouchableOpacity
            onPress={handleLogout}
            style={[{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: hs(8), paddingVertical: vs(16), borderRadius: hs(16) }, { backgroundColor: theme.surfaceContainerLow }]}
          >
            <MaterialCommunityIcons name="logout" size={hs(20)} color={theme.onSurface} />
            <Text style={[{ fontSize: fontScale(16), fontWeight: "700" }, { color: theme.onSurface }]}>{t("logout")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={showAddWorkplace} transparent animationType="fade" onRequestClose={handleCloseWorkplaceModal}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", paddingHorizontal: hs(24) }}>
          <View style={[{ borderRadius: hs(24), padding: hs(24), backgroundColor: theme.surface }]}>
            <Text style={{ fontSize: fontScale(18), fontWeight: "700", marginBottom: vs(16), color: theme.onSurface }}>
              {editingWorkplace ? t("editWorkplace") : t("addWorkplace")}
            </Text>

            <InputField label={t("workplaceName")} placeholder={t("workplaceNamePlaceholder")} value={newWorkplace.place_name} onChangeText={(v) => setNewWorkplace((p) => ({ ...p, place_name: v }))} />

            <CustomSelect label={t("workplaceType")} value={newWorkplace.place_type} placeholder={t("selectPlaceholder")} options={WORKPLACE_TYPES} onSelect={(v) => setNewWorkplace((p) => ({ ...p, place_type: v }))} visible={workplaceTypeModal} setVisible={setWorkplaceTypeModal} />

            <TouchableOpacity
              onPress={() => setShowLocationPicker(true)}
              style={{ flexDirection: "row", alignItems: "center", gap: hs(8), paddingVertical: vs(14), paddingHorizontal: hs(16), borderRadius: hs(12), borderWidth: 1, borderColor: theme.outlineVariant, backgroundColor: theme.surfaceContainerLowest, marginBottom: vs(12) }}
            >
              <MaterialCommunityIcons name="map-marker-plus" size={hs(20)} color={theme.primary} />
              <Text style={{ fontSize: fontScale(14), fontWeight: "600", color: newWorkplace.latitude ? theme.onSurface : theme.onSurfaceVariant }}>
                {newWorkplace.latitude ? `${t("latitude")}: ${Number(newWorkplace.latitude).toFixed(4)}, ${t("longitude")}: ${Number(newWorkplace.longitude).toFixed(4)}` : t("pickLocation")}
              </Text>
            </TouchableOpacity>

            <InputField label={t("geofenceRadius")} placeholder="50" keyboardType="number-pad" value={newWorkplace.radius_meters} onChangeText={(v) => setNewWorkplace((p) => ({ ...p, radius_meters: v }))} />

            <View style={{ flexDirection: "row", gap: hs(12) }}>
              <TouchableOpacity style={{ flex: 1, paddingVertical: vs(12), borderRadius: hs(12), alignItems: "center", backgroundColor: theme.surfaceContainerLow }} onPress={handleCloseWorkplaceModal}>
                <Text style={{ fontSize: fontScale(16), fontWeight: "700", color: theme.onSurfaceVariant }}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, paddingVertical: vs(12), borderRadius: hs(12), alignItems: "center", backgroundColor: theme.primary }} onPress={handleAddWorkplace}>
                <Text style={{ fontSize: fontScale(16), fontWeight: "700", color: "white" }}>
                  {editingWorkplace ? t("update") : t("add")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <LocationPickerModal
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onConfirm={(lat, lng) => setNewWorkplace((p) => ({ ...p, latitude: String(lat), longitude: String(lng) }))}
        initialLatitude={newWorkplace.latitude}
        initialLongitude={newWorkplace.longitude}
      />

      <View style={tw`absolute bottom-0 left-0 right-0 z-50`}>
        <DoctorBottomNavBar activeTab="Profile" />
      </View>
    </SafeAreaView>
  );
}
