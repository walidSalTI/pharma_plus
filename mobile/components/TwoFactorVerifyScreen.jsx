import { useState, useRef, useEffect } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import tw from "twrnc";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useResponsive } from "@/constants/responsive";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { verifyDoctor2FA } from "@/services/doctorAuthService";
import { verifyRep2FA } from "@/services/repAuthService";
import {
  setToken,
  setUserRole,
  getPending2FAToken,
  getPending2FARole,
  clearPending2FA,
} from "@/services/tokenService";
import { useAuth } from "@/src/context/AuthContext";

export default function TwoFactorVerifyScreen({ role = "doctor" }) {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { hs, vs, fontScale, isTablet } = useResponsive();
  const { t } = useLanguage();
  const { signIn } = useAuth();

  const [mode, setMode] = useState("totp");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, [mode]);

  useEffect(() => {
    (async () => {
      const storedRole = await getPending2FARole();
      if (!storedRole) {
        router.replace(role === "doctor" ? "/(auth-doctor)/DoctorLoginScreen" : "/(auth-rep)/RepLoginScreen");
      }
    })();
  }, [role, router]);

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
    Keyboard.dismiss();
    try {
      const twoFactorToken = await getPending2FAToken();
      if (!twoFactorToken) {
        setError(t("twoFactorSessionExpired"));
        return;
      }

      const verifyFn = role === "doctor" ? verifyDoctor2FA : verifyRep2FA;
      const res = await verifyFn(twoFactorToken, code);

      const authToken = res.data?.token;

      if (authToken) {
        await setToken(authToken);
        await setUserRole(role);
      }

      await clearPending2FA();
      signIn(role);
      router.replace(role === "doctor" ? "/(doctor)/DoctorDashboard" : "/(rep)/RepDashboard");
    } catch (err) {
      const message = err.message || t("twoFactorInvalidCode");
      setError(message);
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverySubmit = async () => {
    if (!recoveryCode.trim()) return;
    setLoading(true);
    setError("");
    Keyboard.dismiss();
    try {
      const twoFactorToken = await getPending2FAToken();
      if (!twoFactorToken) {
        setError(t("twoFactorSessionExpired"));
        return;
      }

      const verifyFn = role === "doctor" ? verifyDoctor2FA : verifyRep2FA;
      const res = await verifyFn(twoFactorToken, recoveryCode.trim());

      const authToken = res.data?.token;

      if (authToken) {
        await setToken(authToken);
        await setUserRole(role);
      }

      await clearPending2FA();
      signIn(role);
      router.replace(role === "doctor" ? "/(doctor)/DoctorDashboard" : "/(rep)/RepDashboard");
    } catch (err) {
      const message = err.message || t("twoFactorInvalidRecoveryCode");
      setError(message);
      setRecoveryCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    await clearPending2FA();
    router.replace(role === "doctor" ? "/(auth-doctor)/DoctorLoginScreen" : "/(auth-rep)/RepLoginScreen");
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: theme.surface }]}>
      <View
        style={{
          position: "absolute",
          width: hs(400),
          height: hs(400),
          borderRadius: hs(200),
          opacity: 0.15,
          top: vs(-150),
          left: role === "doctor" ? hs(-100) : undefined,
          right: role === "rep" ? hs(-100) : undefined,
          backgroundColor: role === "doctor" ? theme.tertiaryContainer : theme.primaryContainer,
        }}
      />

      <ScrollView
        contentContainerStyle={[tw`flex-grow justify-center py-12`, { paddingHorizontal: isTablet ? hs(120) : hs(24) }]}
      >
        <View style={{ alignItems: "center", marginBottom: vs(36) }}>
          <View
            style={{
              width: hs(56),
              height: hs(56),
              borderRadius: hs(16),
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: theme.primaryContainer,
            }}
          >
            <MaterialCommunityIcons name="shield-lock" size={hs(28)} color={theme.primary} />
          </View>
          <Text
            style={{
              fontSize: fontScale(24),
              fontWeight: "700",
              marginTop: vs(16),
              letterSpacing: -0.5,
              textAlign: "center",
              color: theme.onSurface,
            }}
          >
            {t("twoFactorTitle")}
          </Text>
          <Text
            style={{
              fontSize: fontScale(14),
              textAlign: "center",
              color: theme.onSurfaceVariant,
              marginTop: vs(8),
            }}
          >
            {t("twoFactorDescription")}
          </Text>
        </View>

        {error ? (
          <View
            style={{
              backgroundColor: theme.errorContainer,
              borderRadius: 12,
              padding: vs(12),
              marginBottom: vs(16),
            }}
          >
            <Text style={{ color: theme.onErrorContainer, fontSize: fontScale(13), textAlign: "center" }}>
              {error}
            </Text>
          </View>
        ) : null}

        {mode === "totp" ? (
          <View style={{ gap: vs(16) }}>
            <Text
              style={{
                fontSize: fontScale(13),
                textAlign: "center",
                color: theme.onSurfaceVariant,
              }}
            >
              {t("twoFactorEnterCode")}
            </Text>

            <View style={{ flexDirection: "row", justifyContent: "center", gap: hs(8) }}>
              {digits.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  style={{
                    width: hs(48),
                    height: vs(56),
                    borderRadius: 12,
                    borderWidth: 1,
                    textAlign: "center",
                    fontSize: fontScale(22),
                    fontWeight: "700",
                    backgroundColor: theme.surfaceContainerLow,
                    borderColor: error ? theme.error : theme.outlineVariant,
                    color: theme.onSurface,
                  }}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(v) => handleDigitChange(i, v)}
                  onKeyPress={(e) => handleKeyDown(i, e)}
                  editable={!loading}
                />
              ))}
            </View>

            {loading && (
              <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 }}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={{ fontSize: fontScale(13), color: theme.onSurfaceVariant }}>
                  {t("twoFactorVerifying")}
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={() => { setMode("recovery"); setError(""); }}
              style={{ alignItems: "center", paddingVertical: vs(8) }}
            >
              <Text style={{ fontSize: fontScale(12), fontWeight: "700", color: theme.primary }}>
                {t("twoFactorUseRecoveryCode")}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: vs(16) }}>
            <Text
              style={{
                fontSize: fontScale(13),
                textAlign: "center",
                color: theme.onSurfaceVariant,
              }}
            >
              {t("twoFactorEnterRecoveryCode")}
            </Text>

            <TextInput
              style={{
                width: "100%",
                height: vs(56),
                borderRadius: 12,
                borderWidth: 1,
                paddingHorizontal: 16,
                fontSize: fontScale(15),
                fontFamily: "monospace",
                letterSpacing: 2,
                textAlign: "center",
                backgroundColor: theme.surfaceContainerLow,
                borderColor: error ? theme.error : theme.outlineVariant,
                color: theme.onSurface,
              }}
              placeholder={t("twoFactorRecoveryPlaceholder")}
              placeholderTextColor={theme.onSurfaceVariant}
              value={recoveryCode}
              onChangeText={(v) => { setRecoveryCode(v); setError(""); }}
              autoCapitalize="none"
              editable={!loading}
            />

            <TouchableOpacity
              onPress={handleRecoverySubmit}
              disabled={loading || !recoveryCode.trim()}
              activeOpacity={0.8}
              style={{
                height: vs(56),
                borderRadius: 28,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: loading || !recoveryCode.trim() ? theme.outlineVariant : theme.primary,
              }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ fontSize: fontScale(16), fontWeight: "700", color: "white" }}>
                  {t("twoFactorVerify")}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setMode("totp"); setError(""); setDigits(["", "", "", "", "", ""]); }}
              style={{ alignItems: "center", paddingVertical: vs(8) }}
            >
              <Text style={{ fontSize: fontScale(12), fontWeight: "700", color: theme.primary }}>
                {t("twoFactorUseAuthenticator")}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          onPress={handleCancel}
          style={{ marginTop: vs(32), alignItems: "center", paddingVertical: vs(8) }}
        >
          <Text style={{ fontSize: fontScale(14), color: theme.onSurfaceVariant }}>
            {t("twoFactorCancel")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
