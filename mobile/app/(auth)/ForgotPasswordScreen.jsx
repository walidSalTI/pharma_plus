import { useRef } from "react";
import {  ActivityIndicator,SafeAreaView,ScrollView,Text,TextInput,TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import tw from "twrnc";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useResponsive } from "@/constants/responsive";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useForgotPassword } from "@/hooks/useForgotPassword";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { hs, vs, fontScale, isTablet } = useResponsive();
  const { t } = useLanguage();
  const {
    email,
    setEmail,
    code,
    setCode,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    step,
    isLoading,
    errors,
    handleSendCode,
    handleResetPassword,
  } = useForgotPassword();

  const inputRefs = useRef([]);

  const handleDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
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
          right: hs(-100),
          backgroundColor: theme.primaryContainer,
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
            <MaterialCommunityIcons name="lock-reset" size={hs(28)} color={theme.primary} />
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
            {t("forgotPasswordTitle")}
          </Text>
          <Text
            style={{
              fontSize: fontScale(14),
              textAlign: "center",
              color: theme.onSurfaceVariant,
              marginTop: vs(8),
            }}
          >
            {step === 1 ? t("forgotPasswordDescription") : t("resetPasswordDescription")}
          </Text>
        </View>

        {step === 1 ? (
          <View style={{ gap: vs(16) }}>
            <View>
              <Text
                style={{
                  fontSize: fontScale(10),
                  fontWeight: "700",
                  textTransform: "uppercase",
                  marginBottom: vs(8),
                  marginLeft: hs(4),
                  color: theme.onSurfaceVariant,
                  letterSpacing: 1,
                }}
              >
                {t("email")}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderRadius: hs(12),
                  borderWidth: 1,
                  paddingHorizontal: hs(16),
                  height: vs(56),
                  backgroundColor: theme.surfaceContainerLow,
                  borderColor: errors.email ? theme.error : theme.outlineVariant,
                }}
              >
                <MaterialCommunityIcons
                  name="email-outline"
                  size={hs(20)}
                  color={theme.onSurfaceVariant}
                />
                <TextInput
                  style={{ flex: 1, height: "100%", marginLeft: hs(12), fontSize: fontScale(16), color: theme.onSurface }}
                  placeholder={t("emailPlaceholder")}
                  placeholderTextColor={theme.onSurfaceVariant}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>
              {errors.email && (
                <Text style={{ fontSize: fontScale(12), marginTop: vs(4), marginLeft: hs(4), color: theme.error }}>
                  {errors.email}
                </Text>
              )}
            </View>

            <TouchableOpacity
              onPress={handleSendCode}
              disabled={isLoading}
              activeOpacity={0.8}
              style={{
                height: vs(56),
                borderRadius: hs(28),
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isLoading ? theme.outlineVariant : theme.primary,
              }}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text numberOfLines={1} style={{ fontSize: fontScale(16), fontWeight: "700", color: "white" }}>
                  {t("forgotPasswordSendCode")}
                </Text>
              )}
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
              {t("emailVerifyEnterCode")}
            </Text>

            <View style={{ flexDirection: "row", justifyContent: "center", gap: hs(8) }}>
              {code.map((digit, i) => (
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
                    borderColor: errors.code ? theme.error : theme.outlineVariant,
                    color: theme.onSurface,
                  }}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(v) => handleDigitChange(i, v)}
                  onKeyPress={(e) => handleKeyDown(i, e)}
                  editable={!isLoading}
                />
              ))}
            </View>
            {errors.code && (
              <Text style={{ fontSize: fontScale(12), textAlign: "center", color: theme.error }}>
                {errors.code}
              </Text>
            )}

            <View>
              <Text
                style={{
                  fontSize: fontScale(10),
                  fontWeight: "700",
                  textTransform: "uppercase",
                  marginBottom: vs(8),
                  marginLeft: hs(4),
                  color: theme.onSurfaceVariant,
                  letterSpacing: 1,
                }}
              >
                {t("resetPasswordNewPassword")}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderRadius: hs(12),
                  borderWidth: 1,
                  paddingHorizontal: hs(16),
                  height: vs(56),
                  backgroundColor: theme.surfaceContainerLow,
                  borderColor: errors.password ? theme.error : theme.outlineVariant,
                }}
              >
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={hs(20)}
                  color={theme.onSurfaceVariant}
                />
                <TextInput
                  style={{ flex: 1, height: "100%", marginLeft: hs(12), fontSize: fontScale(16), color: theme.onSurface }}
                  placeholder="••••••••"
                  placeholderTextColor={theme.onSurfaceVariant}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  editable={!isLoading}
                />
              </View>
              {errors.password && (
                <Text style={{ fontSize: fontScale(12), marginTop: vs(4), marginLeft: hs(4), color: theme.error }}>
                  {errors.password}
                </Text>
              )}
            </View>

            <View>
              <Text
                style={{
                  fontSize: fontScale(10),
                  fontWeight: "700",
                  textTransform: "uppercase",
                  marginBottom: vs(8),
                  marginLeft: hs(4),
                  color: theme.onSurfaceVariant,
                  letterSpacing: 1,
                }}
              >
                {t("resetPasswordConfirmPassword")}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderRadius: hs(12),
                  borderWidth: 1,
                  paddingHorizontal: hs(16),
                  height: vs(56),
                  backgroundColor: theme.surfaceContainerLow,
                  borderColor: errors.confirmPassword ? theme.error : theme.outlineVariant,
                }}
              >
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={hs(20)}
                  color={theme.onSurfaceVariant}
                />
                <TextInput
                  style={{ flex: 1, height: "100%", marginLeft: hs(12), fontSize: fontScale(16), color: theme.onSurface }}
                  placeholder="••••••••"
                  placeholderTextColor={theme.onSurfaceVariant}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!isLoading}
                />
              </View>
              {errors.confirmPassword && (
                <Text style={{ fontSize: fontScale(12), marginTop: vs(4), marginLeft: hs(4), color: theme.error }}>
                  {errors.confirmPassword}
                </Text>
              )}
            </View>

            <TouchableOpacity
              onPress={handleResetPassword}
              disabled={isLoading}
              activeOpacity={0.8}
              style={{
                height: vs(56),
                borderRadius: hs(28),
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isLoading ? theme.outlineVariant : theme.primary,
              }}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text numberOfLines={1} style={{ fontSize: fontScale(16), fontWeight: "700", color: "white" }}>
                  {t("resetPasswordButton")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          onPress={() => router.replace("/(auth)/LoginScreen")}
          style={{ marginTop: vs(32), alignItems: "center", paddingVertical: vs(8) }}
        >
          <Text style={{ fontSize: fontScale(14), color: theme.onSurfaceVariant }}>
            {t("forgotPasswordBackToLogin")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
