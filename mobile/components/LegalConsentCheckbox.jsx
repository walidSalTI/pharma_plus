import { Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useResponsive } from "@/constants/responsive";
import { useLanguage } from "@/src/i18n/LanguageContext";

export default function LegalConsentCheckbox({ checked, onToggle }) {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { hs, vs, fontScale } = useResponsive();
  const { t } = useLanguage();

  return (
    <TouchableOpacity
      onPress={onToggle}
      style={{ flexDirection: "row", alignItems: "center", gap: hs(10), marginTop: vs(8) }}
    >
      <View
        style={[{ width: hs(24), height: hs(24), borderRadius: hs(6), alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: checked ? theme.primary : theme.outlineVariant }, { backgroundColor: checked ? theme.primary : "transparent" }]}
      >
        {checked && <MaterialCommunityIcons name="check" size={hs(16)} color="white" />}
      </View>
      <Text style={[{ flex: 1, fontSize: fontScale(13), lineHeight: vs(20) }, { color: theme.onSurfaceVariant }]}>
        {t("agreePrefix")}
        <Text style={[{ fontWeight: "700" }, { color: theme.primary }]} onPress={() => router.push("/terms")}>
          {t("termsOfUse")}
        </Text>
        {t("agreeAnd")}
        <Text style={[{ fontWeight: "700" }, { color: theme.primary }]} onPress={() => router.push("/privacy")}>
          {t("privacyPolicy")}
        </Text>
      </Text>
    </TouchableOpacity>
  );
}