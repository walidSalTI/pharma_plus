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
import { useRouter } from "expo-router";
import tw from "twrnc";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useResponsive } from "@/constants/responsive";
import { useLanguage } from "@/src/i18n/LanguageContext";
import QRCode from "react-native-qrcode-svg";
import { useTwoFactorSettings } from "@/hooks/useTwoFactorSettings";

export default function TwoFactorSetupScreen({ role = "doctor" }) {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { hs, vs, fontScale, isTablet } = useResponsive();
  const { t } = useLanguage();
  const {
    isEnabled,
    loading,
    qrData,
    confirmCode,
    recoveryCodes,
    step,
    actionLoading,
    inputRefs,
    handleEnable,
    handleConfirm,
    handleDisable,
    handleDigitChange,
    handleKeyDown,
    resetToStatus,
  } = useTwoFactorSettings(role);

  useEffect(() => {
    if (step === "setup") {
      inputRefs.current[0]?.focus();
    }
  }, [step, inputRefs]);

  const bgColor = role === "doctor" ? theme.tertiaryContainer : theme.primaryContainer;

  if (loading) {
    return (
      <SafeAreaView style={[tw`flex-1`, { backgroundColor: theme.surface, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

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
        {step === "status" && (
          <View style={{ gap: vs(24) }}>
            <View style={{ alignItems: "center", marginBottom: vs(16) }}>
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
                {t("twoFactorSettingsTitle")}
              </Text>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: theme.surfaceContainerLow,
                borderRadius: hs(16),
                padding: vs(16),
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: hs(12) }}>
                <MaterialCommunityIcons
                  name={isEnabled ? "shield-check" : "shield-off"}
                  size={hs(24)}
                  color={isEnabled ? theme.primary : theme.onSurfaceVariant}
                />
                <View>
                  <Text style={{ fontSize: fontScale(16), fontWeight: "600", color: theme.onSurface }}>
                    {t("twoFactorSettingsTitle")}
                  </Text>
                  <Text style={{ fontSize: fontScale(13), color: theme.onSurfaceVariant }}>
                    {isEnabled ? t("twoFactorEnabled") : t("twoFactorDisabled")}
                  </Text>
                </View>
              </View>
              <View
                style={{
                  width: hs(51),
                  height: vs(31),
                  borderRadius: hs(16),
                  backgroundColor: isEnabled ? theme.primary : theme.outlineVariant,
                  justifyContent: "center",
                  paddingHorizontal: hs(2),
                }}
              >
                <View
                  style={{
                    width: hs(27),
                    height: vs(27),
                    borderRadius: hs(14),
                    backgroundColor: "white",
                    alignSelf: isEnabled ? "flex-end" : "flex-start",
                    elevation: 2,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.2,
                    shadowRadius: 2,
                  }}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={isEnabled ? handleDisable : handleEnable}
              disabled={actionLoading}
              activeOpacity={0.8}
              style={{
                height: vs(56),
                borderRadius: hs(28),
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: actionLoading
                  ? theme.outlineVariant
                  : isEnabled
                  ? theme.error
                  : theme.primary,
              }}
            >
              {actionLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ fontSize: fontScale(16), fontWeight: "700", color: "white" }}>
                  {isEnabled ? t("twoFactorDisable") : t("twoFactorEnable")}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              style={{ alignItems: "center", paddingVertical: vs(8) }}
            >
              <Text style={{ fontSize: fontScale(14), color: theme.onSurfaceVariant }}>
                {t("cancel")}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {step === "setup" && qrData && (
          <View style={{ gap: vs(20) }}>
            <View style={{ alignItems: "center" }}>
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
                <MaterialCommunityIcons name="qrcode" size={hs(28)} color={theme.primary} />
              </View>
              <Text
                style={{
                  fontSize: fontScale(20),
                  fontWeight: "700",
                  marginTop: vs(12),
                  letterSpacing: -0.5,
                  textAlign: "center",
                  color: theme.onSurface,
                }}
              >
                {t("twoFactorSetupTitle")}
              </Text>
              <Text
                style={{
                  fontSize: fontScale(13),
                  textAlign: "center",
                  color: theme.onSurfaceVariant,
                  marginTop: vs(8),
                }}
              >
                {t("twoFactorSetupInstructions")}
              </Text>
            </View>

            {(qrData.qr_code || qrData.qr_code_url || qrData.otpauth_url || qrData.uri || qrData.secret) && (
              <View style={{ alignItems: "center" }}>
                <View
                  style={{
                    backgroundColor: "white",
                    borderRadius: hs(16),
                    padding: hs(16),
                    alignItems: "center",
                  }}
                >
                  <QRCode
                    value={qrData.qr_code || qrData.qr_code_url || qrData.otpauth_url || qrData.uri || `otpauth://totp/PharmaPlus?secret=${qrData.secret}&issuer=PharmaPlus&algorithm=SHA1&digits=6&period=30`}
                    size={hs(200)}
                    color="#000000"
                    backgroundColor="#ffffff"
                  />
                </View>
              </View>
            )}

            {qrData.secret && (
              <View
                style={{
                backgroundColor: theme.surfaceContainerLow,
                borderRadius: hs(12),
                padding: vs(12),
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: fontScale(11), color: theme.onSurfaceVariant, marginBottom: vs(4) }}>
                  Secret Key
                </Text>
                <Text style={{ fontSize: fontScale(14), fontFamily: "monospace", color: theme.onSurface, letterSpacing: 2 }}>
                  {qrData.secret}
                </Text>
              </View>
            )}

            <Text
              style={{
                fontSize: fontScale(13),
                textAlign: "center",
                color: theme.onSurfaceVariant,
              }}
            >
              {t("twoFactorSetupDescription")}
            </Text>

            <View style={{ flexDirection: "row", justifyContent: "center", gap: hs(8) }}>
              {confirmCode.map((digit, i) => (
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
                    borderColor: theme.outlineVariant,
                    color: theme.onSurface,
                  }}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(v) => handleDigitChange(i, v)}
                  onKeyPress={(e) => handleKeyDown(i, e)}
                  editable={!actionLoading}
                />
              ))}
            </View>

            <TouchableOpacity
              onPress={handleConfirm}
              disabled={actionLoading || confirmCode.some((d) => !d)}
              activeOpacity={0.8}
              style={{
                height: vs(56),
                borderRadius: hs(28),
                alignItems: "center",
                justifyContent: "center",
                backgroundColor:
                  actionLoading || confirmCode.some((d) => !d) ? theme.outlineVariant : theme.primary,
              }}
            >
              {actionLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ fontSize: fontScale(16), fontWeight: "700", color: "white" }}>
                  {t("twoFactorConfirmSetup")}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={resetToStatus}
              style={{ alignItems: "center", paddingVertical: vs(8) }}
            >
              <Text style={{ fontSize: fontScale(14), color: theme.onSurfaceVariant }}>
                {t("cancel")}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {step === "recovery" && (
          <View style={{ gap: vs(20) }}>
            <View style={{ alignItems: "center" }}>
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
                <MaterialCommunityIcons name="key-variant" size={hs(28)} color={theme.primary} />
              </View>
              <Text
                style={{
                  fontSize: fontScale(20),
                  fontWeight: "700",
                  marginTop: vs(12),
                  letterSpacing: -0.5,
                  textAlign: "center",
                  color: theme.onSurface,
                }}
              >
                {t("twoFactorRecoveryCodes")}
              </Text>
              <Text
                style={{
                  fontSize: fontScale(13),
                  textAlign: "center",
                  color: theme.onSurfaceVariant,
                  marginTop: vs(8),
                }}
              >
                {t("twoFactorRecoveryDescription")}
              </Text>
            </View>

            <View
              style={{
                backgroundColor: theme.surfaceContainerLow,
                borderRadius: hs(12),
                padding: vs(16),
                gap: hs(8),
              }}
            >
              {recoveryCodes.map((code, i) => (
                <Text
                  key={i}
                  style={{
                    fontSize: fontScale(14),
                    fontFamily: "monospace",
                    letterSpacing: 2,
                    color: theme.onSurface,
                    textAlign: "center",
                  }}
                >
                  {code}
                </Text>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.8}
              style={{
                height: vs(56),
                borderRadius: hs(28),
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: theme.primary,
              }}
            >
              <Text style={{ fontSize: fontScale(16), fontWeight: "700", color: "white" }}>
                {t("done")}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
