import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useResponsive } from "@/constants/responsive";

export default function ErrorState({ message, onRetry, offline = false, banner = false }) {
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const { hs, vs, fontScale } = useResponsive();

  if (banner) {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: hs(10),
          paddingHorizontal: hs(16),
          paddingVertical: vs(10),
          borderRadius: hs(14),
          marginBottom: vs(16),
          backgroundColor: "#fffbeb",
          borderWidth: 1,
          borderColor: "#fde68a",
        }}
      >
        <MaterialCommunityIcons name="cloud-off-outline" size={hs(20)} color="#d97706" />
        <Text style={{ flex: 1, fontSize: fontScale(13), fontWeight: "600", color: "#b45309" }}>
          {message || t("offlineMode")}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ alignItems: "center", marginTop: vs(40), paddingHorizontal: hs(24) }}>
      <View
        style={[
          {
            width: hs(64),
            height: hs(64),
            borderRadius: hs(32),
            alignItems: "center",
            justifyContent: "center",
            marginBottom: vs(16),
          },
          { backgroundColor: offline ? "#fffbeb" : theme.errorContainer + "40" },
        ]}
      >
        <MaterialCommunityIcons
          name={offline ? "cloud-off-outline" : "wifi-off"}
          size={hs(28)}
          color={offline ? "#d97706" : theme.error}
        />
      </View>
      <Text
        style={[
          { fontSize: fontScale(16), fontWeight: "700", textAlign: "center" },
          { color: theme.onSurface },
        ]}
      >
        {message || (offline ? t("offlineMode") : t("couldNotLoad"))}
      </Text>
      <Text
        style={[
          { fontSize: fontScale(13), marginTop: vs(8), textAlign: "center" },
          { color: theme.onSurfaceVariant },
        ]}
      >
        {t("checkConnection")}
      </Text>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          style={[
            {
              flexDirection: "row",
              alignItems: "center",
              gap: hs(8),
              paddingHorizontal: hs(24),
              paddingVertical: vs(12),
              borderRadius: hs(24),
              marginTop: vs(16),
            },
            { backgroundColor: theme.primary },
          ]}
        >
          <MaterialCommunityIcons name="refresh" size={hs(18)} color="white" />
          <Text style={{ fontSize: fontScale(14), fontWeight: "700", color: "white" }}>
            {t("retry")}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
