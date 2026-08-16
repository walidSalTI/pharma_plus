import { View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useResponsive } from "@/constants/responsive";
import { useLanguage } from "@/src/i18n/LanguageContext";

export default function TotpQrDisplay({ payload, timeRemaining, isActive, error }) {
  const { theme } = useAppTheme();
  const { hs, vs, fontScale } = useResponsive();
  const { t } = useLanguage();

  if (!isActive || !payload) {
    return (
      <View
        style={{
          height: vs(280),
          borderRadius: hs(24),
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.surfaceContainerLow,
          borderWidth: 2,
          borderStyle: "dashed",
          borderColor: error ? theme.error : theme.outlineVariant,
          padding: hs(16),
        }}
      >
        <MaterialCommunityIcons
          name={error ? "alert-circle-outline" : "qrcode-scan"}
          size={hs(40)}
          color={error ? theme.error : theme.onSurfaceVariant}
          style={{ marginBottom: vs(8) }}
        />
        <Text style={{ fontSize: fontScale(16), fontWeight: "600", color: error ? theme.error : theme.onSurfaceVariant, textAlign: "center" }}>
          {error ? t("qrError") : t("sessionPaused")}
        </Text>
        <Text style={{ fontSize: fontScale(12), color: error ? theme.error : theme.onSurfaceVariant, marginTop: vs(4), textAlign: "center" }}>
          {error || t("sessionPausedDesc")}
        </Text>
      </View>
    );
  }

  const qrValue = JSON.stringify(payload);
  const progress = timeRemaining / 30;

  return (
    <View
      style={{
        borderRadius: hs(24),
        padding: hs(24),
        alignItems: "center",
        backgroundColor: theme.surfaceContainerLowest,
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
      }}
    >
      <View
        style={{
          padding: hs(16),
          borderRadius: hs(16),
          backgroundColor: "white",
        }}
      >
        <QRCode
          value={qrValue}
          size={hs(200)}
          bgColor="#000000"
          fgColor="#ffffff"
        />
      </View>

      <View style={{ marginTop: vs(20), alignItems: "center", width: "100%" }}>
        <Text style={{ fontSize: fontScale(14), fontWeight: "600", color: theme.onSurfaceVariant, marginBottom: vs(8) }}>
          {t("codeExpiresIn")} {timeRemaining}s
        </Text>
        <View style={{ width: "100%", height: 4, borderRadius: 2, backgroundColor: theme.surfaceContainerHigh, overflow: "hidden" }}>
          <View
            style={{
              width: `${progress * 100}%`,
              height: "100%",
              borderRadius: 2,
              backgroundColor: timeRemaining <= 5 ? theme.error : theme.primary,
            }}
          />
        </View>
      </View>
    </View>
  );
}
