import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { RANKS } from "@/services/interactionService";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useResponsive } from "@/constants/responsive";

export default function InteractionAlertModal({ payload, visible, onProceed, onCancel }) {
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const { hs, vs, fontScale } = useResponsive();

  if (!payload) return null;

  const isError = payload.rank === RANKS.ERROR || payload.isError;
  const isHighRisk = payload.rank >= RANKS.HIGH;
  const affected = Array.isArray(payload.medications) ? payload.medications : [];
  const title = isError
    ? t("interactionCheckUnavailableTitle")
    : isHighRisk
      ? t("highRiskTitle")
      : t("possibleInteractionTitle");
  const accent = isError ? "#d97706" : isHighRisk ? "#dc2626" : theme.primary;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: hs(24) }}>
        <View style={{ width: "100%", maxWidth: hs(480), backgroundColor: theme.surfaceContainerLowest, borderRadius: hs(24), padding: hs(20) }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: hs(10), marginBottom: vs(12) }}>
            <MaterialCommunityIcons name={isError ? "cloud-off-outline" : "alert-octagon"} size={hs(26)} color={accent} />
            <Text style={{ fontSize: fontScale(17), fontWeight: "700", flex: 1, color: accent }}>
              {title}
            </Text>
          </View>

          {affected.length > 0 ? (
            <>
              <Text style={{ fontSize: fontScale(14), fontWeight: "700", marginBottom: vs(8), color: theme.onSurface }}>
                {t("affectedMeds")}
              </Text>
              <ScrollView style={{ maxHeight: vs(160), marginBottom: vs(12) }} showsVerticalScrollIndicator={false}>
                {affected.map((name, idx) => (
                  <View key={idx} style={{ flexDirection: "row", alignItems: "center", gap: hs(8), paddingVertical: vs(4) }}>
                    <MaterialCommunityIcons name="pill" size={hs(16)} color={theme.primary} />
                    <Text style={{ fontSize: fontScale(13), color: theme.onSurfaceVariant }}>{name}</Text>
                  </View>
                ))}
              </ScrollView>
            </>
          ) : null}

          {isError ? (
            <Text style={{ fontSize: fontScale(13), lineHeight: fontScale(18), marginBottom: vs(12), color: theme.onSurfaceVariant }}>
              {t("interactionCheckUnavailableDesc")}
            </Text>
          ) : payload.message ? (
            <Text style={{ fontSize: fontScale(13), marginBottom: vs(12), color: theme.onSurfaceVariant }}>
              {payload.message}
            </Text>
          ) : null}

          <Text style={{ fontSize: fontScale(12), lineHeight: fontScale(18), marginBottom: vs(16), color: theme.onSurfaceVariant }}>
            {t("advisoryNote")}
          </Text>

          <View style={{ flexDirection: "row", gap: hs(10) }}>
            <TouchableOpacity
              onPress={onCancel}
              style={{ flex: 1, height: vs(46), borderRadius: hs(12), alignItems: "center", justifyContent: "center", backgroundColor: theme.surfaceContainerLow }}
            >
              <Text style={{ fontSize: fontScale(14), fontWeight: "700", color: theme.onSurface }}>{t("cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onProceed}
              style={{ flex: 1, height: vs(46), borderRadius: hs(12), alignItems: "center", justifyContent: "center", backgroundColor: accent }}
            >
              <Text style={{ fontSize: fontScale(14), fontWeight: "700", color: "white" }}>
                {isHighRisk || isError ? t("proceedAtOwnRisk") : t("proceed")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
