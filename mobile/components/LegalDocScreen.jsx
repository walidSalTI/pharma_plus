import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import tw from "twrnc";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useResponsive } from "@/constants/responsive";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useToast } from "@/src/context/ToastContext";
import { webShadow } from "@/constants/shadow";
import { getConsent, setConsent, LEGAL_TERMS_VERSION } from "@/services/legalConsentStorage";

export default function LegalDocScreen({ title, subtitle, sections, returnTo }) {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { hs, vs, fontScale, isTablet } = useResponsive();
  const { t, language } = useLanguage();
  const { success: toastSuccess, info: toastInfo, error: toastError } = useToast();

  const [checked, setChecked] = useState(false);
  const [alreadyAccepted, setAlreadyAccepted] = useState(false);
  const [acceptedAt, setAcceptedAt] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const consent = await getConsent();
      setAlreadyAccepted(consent.accepted === true && consent.version === LEGAL_TERMS_VERSION);
      setAcceptedAt(consent.acceptedAt || null);
    })();
  }, []);

  const handleAccept = async () => {
    if (!checked && !alreadyAccepted) {
      toastError(t("consentRequired"));
      return;
    }
    setSaving(true);
    await setConsent(true, ["terms", "privacy"]);
    setSaving(false);
    toastSuccess(t("termsAccepted"));
    if (returnTo) {
      router.replace(returnTo);
    } else {
      router.back();
    }
  };

  const handleDecline = async () => {
    setSaving(true);
    await setConsent(false, ["terms", "privacy"]);
    setSaving(false);
    toastInfo(t("termsDeclined"));
    if (!returnTo) {
      router.back();
    }
  };

  const openTerms = () => router.push("/terms");
  const openPrivacy = () => router.push("/privacy");

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: theme.surface }]}>
      <View style={[{ flexDirection: "row", alignItems: "center", paddingHorizontal: hs(24), height: vs(64), borderBottomWidth: 1, borderBottomColor: theme.outlineVariant }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[{ width: hs(40), height: hs(40), borderRadius: hs(20), alignItems: "center", justifyContent: "center" }, { backgroundColor: theme.surfaceContainerLow }]}
        >
          <MaterialCommunityIcons name="arrow-left" size={hs(22)} color={theme.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: hs(16) }}>
          <Text style={[{ fontSize: fontScale(20), fontWeight: "700" }, { color: theme.onSurface }]}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[{ fontSize: fontScale(12), marginTop: vs(2) }, { color: theme.onSurfaceVariant }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: isTablet ? hs(120) : hs(24), paddingTop: vs(24), paddingBottom: vs(32) }}>
        {sections.map((section, index) => (
          <View key={index} style={{ marginBottom: vs(20) }}>
            <Text style={[{ fontSize: fontScale(15), fontWeight: "700", marginBottom: vs(6) }, { color: theme.onSurface }]}>
              {section.title}
            </Text>
            {(Array.isArray(section.body) ? section.body : [section.body]).map((paragraph, pIndex) => (
              <Text
                key={pIndex}
                style={[{ fontSize: fontScale(13), lineHeight: vs(22), marginTop: pIndex > 0 ? vs(6) : 0 }, { color: theme.onSurfaceVariant }]}
              >
                {paragraph}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>

      <View
        style={[
          {
            paddingHorizontal: isTablet ? hs(120) : hs(24),
            paddingTop: vs(12),
            paddingBottom: vs(24),
            borderTopWidth: 1,
            borderTopColor: theme.outlineVariant,
          },
        ]}
      >
        {alreadyAccepted ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: hs(12), padding: hs(16), borderRadius: hs(16), backgroundColor: theme.primaryContainer }}>
            <MaterialCommunityIcons name="shield-check-outline" size={hs(24)} color={theme.primary} />
            <Text style={[{ flex: 1, fontSize: fontScale(13), lineHeight: vs(20) }, { color: theme.onSurface }]}>
              {t("alreadyAcceptedNote")}
              {acceptedAt
                ? `\n${t("acceptedOnDate", { date: new Date(acceptedAt).toLocaleDateString(language === "ar" ? "ar" : "en-GB") })}`
                : ""}
            </Text>
          </View>
        ) : (
          <>
            <TouchableOpacity
              onPress={() => setChecked(!checked)}
              style={{ flexDirection: "row", alignItems: "center", gap: hs(10), marginBottom: vs(16) }}
            >
              <View
                style={[{ width: hs(24), height: hs(24), borderRadius: hs(6), alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: checked ? theme.primary : theme.outlineVariant }, { backgroundColor: checked ? theme.primary : "transparent" }]}
              >
                {checked && <MaterialCommunityIcons name="check" size={hs(16)} color="white" />}
              </View>
              <Text style={[{ flex: 1, fontSize: fontScale(13), lineHeight: vs(20) }, { color: theme.onSurfaceVariant }]}>
                {t("agreePrefix")}
                <Text style={[{ fontWeight: "700" }, { color: theme.primary }]} onPress={openTerms}>
                  {t("termsOfUse")}
                </Text>
                {t("agreeAnd")}
                <Text style={[{ fontWeight: "700" }, { color: theme.primary }]} onPress={openPrivacy}>
                  {t("privacyPolicy")}
                </Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAccept}
              disabled={saving}
              style={{
                paddingVertical: vs(16),
                borderRadius: hs(16),
                alignItems: "center",
                marginBottom: vs(12),
                backgroundColor: theme.primary,
                opacity: saving ? 0.6 : 1,
                ...webShadow({ elevation: 6, color: theme.primary, radius: 12, offsetY: 6 }),
              }}
            >
              {saving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={[{ fontSize: fontScale(16), fontWeight: "700", color: "white" }]}>{t("acceptTerms")}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDecline}
              disabled={saving}
              style={[{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: hs(8), paddingVertical: vs(14), borderRadius: hs(16) }, { backgroundColor: theme.surfaceContainerLow }]}
            >
              <MaterialCommunityIcons name="close" size={hs(20)} color={theme.onSurface} />
              <Text style={[{ fontSize: fontScale(16), fontWeight: "700" }, { color: theme.onSurface }]}>
                {t("declineTerms")}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}