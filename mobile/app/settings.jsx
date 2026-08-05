import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import tw from "twrnc";
import { InputField } from "@/components/FormInputs";
import { logoutUser } from "@/services/authService";
import { logoutDoctor } from "@/services/doctorAuthService";
import { logoutRep } from "@/services/repAuthService";
import { clearToken, getUserRole } from "@/services/tokenService";
import { clearAllReminders } from "@/services/reminderCleanup";
import { deleteAccount, getProfile, updateProfile } from "@/services/profileService";
import { getRepDashboard } from "@/services/repService";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useToast } from "@/src/context/ToastContext";
import { useCustomAlert } from "@/src/context/CustomAlertContext";
import { useAuth } from "@/src/context/AuthContext";
import { webShadow } from "@/constants/shadow";
import { useResponsive } from "@/constants/responsive";
import ErrorState from "@/components/ErrorState";

export default function SettingsScreen() {
  const router = useRouter();
  const { language, toggleLanguage, t } = useLanguage();
  const { theme, isDark, toggleTheme } = useAppTheme();
  const { hs, vs, fontScale, isTablet } = useResponsive();
  const { success: toastSuccess, error: toastError } = useToast();
  const { confirm } = useCustomAlert();
  const { signOut } = useAuth();

  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fName, setFName] = useState("");
  const [lName, setLName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [location, setLocation] = useState("");
  const [company, setCompany] = useState("");
  const [errors, setErrors] = useState({});

  const isRep = role === "rep";

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const currentRole = await getUserRole();
      setRole(currentRole);

      if (currentRole === "rep") {
        const data = await getRepDashboard();
        const rep = data?.data?.rep || {};
        setFName(rep.f_name || rep.name?.split(" ")[0] || "");
        setLName(rep.l_name || rep.name?.split(" ").slice(1).join(" ") || "");
        setEmail(rep.email || "");
        setCompany(rep.company || "");
      } else {
        const data = await getProfile();
        setFName(data.f_name || "");
        setLName(data.l_name || "");
        setEmail(data.email || "");
        setPhone(data.phone_number || "");
        setAge(data.age ? String(data.age) : "");
        setLocation(data.location || "");
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const validate = () => {
    const errs = {};
    if (!fName.trim()) errs.fName = t("fNameRequired");
    if (!lName.trim()) errs.lName = t("lNameRequired");
    if (!isRep && age && (isNaN(Number(age)) || Number(age) < 1 || Number(age) > 150))
      errs.age = t("invalidAge");
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await updateProfile({
        f_name: fName.trim(),
        l_name: lName.trim(),
        ...(isRep ? {} : {
          age: age ? Number(age) : undefined,
          location: location.trim() || undefined,
          phone_number: phone.trim() || undefined,
        }),
      });
      toastSuccess(t("profileSaved"));
    } catch (e) {
      toastError(e.message || t("failedUpdate"));
    } finally {
      setSaving(false);
    }
  };

  const performLogout = async () => {
    try {
      if (role === "doctor") {
        await logoutDoctor();
      } else if (role === "rep") {
        await logoutRep();
      } else {
        await logoutUser();
      }
    } catch {
      // Ignore network failures; token is cleared locally regardless.
    }
    await clearAllReminders();
    await clearToken();
    signOut();
    router.replace("/");
  };

  const handleLogout = () => {
    confirm({
      title: t("logout"),
      message: t("logoutConfirm"),
      confirmText: t("logout"),
      cancelText: t("cancel"),
      variant: "logout",
      onConfirm: performLogout,
    });
  };

  const handleDeleteAccount = () => {
    if (isRep) return;
    confirm({
      title: t("deleteAccount"),
      message: t("deleteConfirm"),
      confirmText: t("delete"),
      cancelText: t("cancel"),
      variant: "delete",
      onConfirm: async () => {
        try {
          await deleteAccount();
          await clearAllReminders();
          await clearToken();
          signOut();
          router.replace("/");
        } catch (e) {
          toastError(e.message || t("failedDelete"));
        }
      },
    });
  };

  if (loading) {
    return (
      <View style={[tw`flex-1 items-center justify-center`, { backgroundColor: theme.surface }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[tw`flex-1 justify-center`, { backgroundColor: theme.surface }]}>
        <ErrorState message={t("couldNotLoad")} onRetry={fetchProfile} />
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
          {t("account")}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: isRep ? vs(192) : vs(48) }}
      >
        <View style={{ alignItems: "center", paddingTop: vs(32), paddingBottom: vs(24) }}>
          <View style={[{ width: hs(80), height: hs(80), borderRadius: hs(40), alignItems: "center", justifyContent: "center" }, { backgroundColor: theme.primaryContainer }]}>
            <Text style={[{ fontSize: fontScale(30), fontWeight: "700" }, { color: theme.primary }]}>
              {fName.charAt(0).toUpperCase()}
              {lName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[{ fontSize: fontScale(20), fontWeight: "700", marginTop: vs(12) }, { color: theme.onSurface }]}>
            {fName} {lName}
          </Text>
          <Text style={[{ fontSize: fontScale(14) }, { color: theme.onSurfaceVariant }]}>
            {email}
          </Text>
        </View>

        <View style={[{ paddingHorizontal: isTablet ? hs(120) : hs(24) }]}>
          <Text style={[{ fontSize: fontScale(10), fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: vs(12) }, { color: theme.onSurfaceVariant }]}>
            {t("personalInfo")}
          </Text>
          <View style={[{ padding: hs(20), borderRadius: hs(32) }, { backgroundColor: theme.surfaceContainerLow }]}>
            <View style={{ flexDirection: "row", gap: hs(12) }}>
              <View style={{ flex: 1 }}>
                <InputField
                  label={t("firstName")}
                  icon="account-outline"
                  value={fName}
                  onChangeText={setFName}
                  placeholder={t("john")}
                  error={errors.fName}
                />
              </View>
              <View style={{ flex: 1 }}>
                <InputField
                  label={t("lastName")}
                  icon="account-outline"
                  value={lName}
                  onChangeText={setLName}
                  placeholder={t("doe")}
                  error={errors.lName}
                />
              </View>
            </View>
            <InputField
              label={t("email")}
              icon="email-outline"
              value={email}
              editable={false}
              placeholder="email@example.com"
            />
            {isRep ? (
              <InputField
                label={t("company")}
                icon="domain"
                value={company}
                editable={false}
              />
            ) : (
              <>
                <InputField
                  label={t("phone")}
                  icon="phone-outline"
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+1 234 567 890"
                  keyboardType="phone-pad"
                />
                <InputField
                  label={t("age")}
                  icon="calendar-outline"
                  value={age}
                  onChangeText={setAge}
                  placeholder="25"
                  keyboardType="number-pad"
                  error={errors.age}
                />
                <InputField
                  label={t("location")}
                  icon="map-marker-outline"
                  value={location}
                  onChangeText={setLocation}
                  placeholder={t("cityAddress")}
                />
              </>
            )}
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
            {t("preferences")}
          </Text>

          <TouchableOpacity
            onPress={toggleTheme}
            style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: hs(16), borderRadius: hs(16), marginBottom: vs(12) }, { backgroundColor: theme.surfaceContainerLowest }]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: hs(12) }}>
              <MaterialCommunityIcons name={isDark ? "weather-night" : "white-balance-sunny"} size={hs(22)} color={theme.onSurfaceVariant} />
              <Text style={[{ fontSize: fontScale(16), fontWeight: "700" }, { color: theme.onSurface }]}>
                {isDark ? "Dark Mode" : "Light Mode"}
              </Text>
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
              <Text style={[{ fontSize: fontScale(16), fontWeight: "700" }, { color: theme.onSurface }]}>
                {t("language")}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: hs(4) }}>
              <View style={[{ paddingHorizontal: hs(16), paddingVertical: vs(6), borderRadius: hs(16) }, { backgroundColor: language === "en" ? theme.primary : theme.surfaceContainerLow }]}>
                <Text style={[{ fontSize: fontScale(12), fontWeight: "700" }, { color: language === "en" ? "white" : theme.onSurfaceVariant }]}>EN</Text>
              </View>
              <Text style={[{ color: theme.outlineVariant }]}>/</Text>
              <View style={[{ paddingHorizontal: hs(16), paddingVertical: vs(6), borderRadius: hs(16) }, { backgroundColor: language === "ar" ? theme.primary : theme.surfaceContainerLow }]}>
                <Text style={[{ fontSize: fontScale(12), fontWeight: "700" }, { color: language === "ar" ? "white" : theme.onSurfaceVariant }]}>AR</Text>
              </View>
            </View>
          </TouchableOpacity>

          {isRep && (
            <TouchableOpacity
              onPress={() => router.push("/(rep)/TwoFactorSetupScreen")}
              style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: hs(16), borderRadius: hs(16), marginTop: vs(12) }, { backgroundColor: theme.surfaceContainerLowest }]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: hs(12) }}>
                <MaterialCommunityIcons name="shield-lock" size={hs(22)} color={theme.onSurfaceVariant} />
                <Text style={[{ fontSize: fontScale(16), fontWeight: "700" }, { color: theme.onSurface }]}>
                  {t("twoFactorSettingsTitle")}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={hs(22)} color={theme.onSurfaceVariant} />
            </TouchableOpacity>
          )}

          <View style={[{ height: 1, marginVertical: vs(32) }, { backgroundColor: theme.outlineVariant }]} />

          <Text style={[{ fontSize: fontScale(10), fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: vs(12) }, { color: theme.onSurfaceVariant }]}>
            {t("accountActions")}
          </Text>

          <TouchableOpacity
            onPress={handleLogout}
            style={[{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: hs(8), paddingVertical: vs(16), borderRadius: hs(16), marginBottom: vs(12) }, { backgroundColor: theme.surfaceContainerLow }]}
          >
            <MaterialCommunityIcons name="logout" size={hs(20)} color={theme.onSurface} />
            <Text style={[{ fontSize: fontScale(16), fontWeight: "700" }, { color: theme.onSurface }]}>
              {t("logout")}
            </Text>
          </TouchableOpacity>

          {!isRep && (
            <TouchableOpacity
              onPress={handleDeleteAccount}
              style={[{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: hs(8), paddingVertical: vs(16), borderRadius: hs(16) }, { backgroundColor: theme.errorContainer + "20" }]}
            >
              <MaterialCommunityIcons name="delete-outline" size={hs(20)} color={theme.error} />
              <Text style={[{ fontSize: fontScale(16), fontWeight: "700" }, { color: theme.error }]}>
                {t("deleteAccount")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
