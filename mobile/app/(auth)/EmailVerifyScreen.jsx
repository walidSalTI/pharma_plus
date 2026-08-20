import { useEffect } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import tw from "twrnc";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useResponsive } from "@/constants/responsive";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useEmailVerify } from "@/hooks/useEmailVerify";

export default function EmailVerifyScreen({ role = "patient" }) {
  const { theme } = useAppTheme();
  const { hs, vs, fontScale, isTablet } = useResponsive();
  const { t } = useLanguage();
  const {
    digits,
    loading,
    resendLoading,
    error,
    resendTimer,
    inputRefs,
    handleDigitChange,
    handleKeyDown,
    handleResend,
    handleCancel,
  } = useEmailVerify();

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, [inputRefs]);

  const bgColor = role === "doctor" ? theme.tertiaryContainer : theme.primaryContainer;

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
          backgroundColor: bgColor,
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
            <MaterialCommunityIcons name="email-check" size={hs(28)} color={theme.primary} />
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
            {t("emailVerifyTitle")}
          </Text>
          <Text
            style={{
              fontSize: fontScale(14),
              textAlign: "center",
              color: theme.onSurfaceVariant,
              marginTop: vs(8),
            }}
          >
            {t("emailVerifyDescription")}
          </Text>
        </View>

        {error ? (
          <View
            style={{
              backgroundColor: theme.errorContainer,
              borderRadius: hs(12),
              padding: vs(12),
              marginBottom: vs(16),
            }}
          >
            <Text style={{ color: theme.onErrorContainer, fontSize: fontScale(13), textAlign: "center" }}>
              {error}
            </Text>
          </View>
        ) : null}

        <View style={{ gap: vs(16) }}>
          <Text
            style={{
              fontSize: fontScale(13),
              textAlign: "center",
              color: theme.onSurfaceVariant,
            }}
          >
            {t("emailVerifyEnterCode")}
          </Text>

          <View style={{ flexDirection: "row", justifyContent: "center", gap: hs(8) }}>
            {digits.map((digit, i) => (
              <TextInput
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                style={{
                  width: hs(48),
                  height: vs(56),
                  borderRadius: hs(12),
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
            <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: hs(8) }}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={{ fontSize: fontScale(13), color: theme.onSurfaceVariant }}>
                {t("emailVerifyVerifying")}
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleResend}
            disabled={resendTimer > 0 || resendLoading}
            style={{ alignItems: "center", paddingVertical: vs(8) }}
          >
            {resendLoading ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Text
                style={{
                  fontSize: fontScale(12),
                  fontWeight: "700",
                  color: resendTimer > 0 ? theme.onSurfaceVariant : theme.primary,
                }}
              >
                {resendTimer > 0
                  ? t("emailVerifyResendIn", { seconds: resendTimer })
                  : t("emailVerifyResend")}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleCancel}
          style={{ marginTop: vs(32), alignItems: "center", paddingVertical: vs(8) }}
        >
          <Text style={{ fontSize: fontScale(14), color: theme.onSurfaceVariant }}>
            {t("emailVerifyCancel")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
