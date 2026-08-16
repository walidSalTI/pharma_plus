import { Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { RANKS } from "@/services/interactionService";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useResponsive } from "@/constants/responsive";

const STYLES = {
  [RANKS.SAFE]: { bg: "#dcfce7", accent: "#16a34a", icon: "check-circle" },
  [RANKS.CAUTION]: { bg: "#fef3c7", accent: "#d97706", icon: "alert-outline" },
  [RANKS.HIGH]: { bg: "#fee2e2", accent: "#dc2626", icon: "alert-octagon" },
  [RANKS.ERROR]: { bg: "#fef3c7", accent: "#d97706", icon: "cloud-off-outline" },
};

export default function InteractionSummaryCard({ payload }) {
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const { hs, vs, fontScale } = useResponsive();

  if (!payload) return null;

  const rank = Number(payload.rank);
  const isError = rank === RANKS.ERROR || payload.isError;
  const style = STYLES[rank] || STYLES[RANKS.ERROR];
  const conflicts = Array.isArray(payload.conflicts) ? payload.conflicts : [];

  const renderConflict = (conflict, idx) => {
    const high = Number(conflict.risk_level) >= RANKS.HIGH;
    return (
      <View
        key={idx}
        style={{
          backgroundColor: theme.surfaceContainerLow,
          borderRadius: hs(12),
          padding: hs(12),
          marginBottom: vs(8),
          borderLeftWidth: 3,
          borderLeftColor: high ? "#dc2626" : "#d97706",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: hs(6) }}>
          <MaterialCommunityIcons name="pill" size={hs(16)} color={high ? "#dc2626" : theme.primary} />
          <Text style={{ fontSize: fontScale(14), fontWeight: "700", color: theme.onSurface, flexShrink: 1 }}>
            {conflict.drug1}
          </Text>
          <Text style={{ fontSize: fontScale(13), color: theme.onSurfaceVariant }}>×</Text>
          <MaterialCommunityIcons name="pill" size={hs(16)} color={high ? "#dc2626" : theme.primary} />
          <Text style={{ fontSize: fontScale(14), fontWeight: "700", color: theme.onSurface, flexShrink: 1 }}>
            {conflict.drug2}
          </Text>
          <View
            style={{
              paddingHorizontal: hs(8),
              paddingVertical: vs(2),
              borderRadius: hs(10),
              backgroundColor: high ? "#fee2e2" : "#fef3c7",
            }}
          >
            <Text style={{ fontSize: fontScale(10), fontWeight: "700", color: high ? "#dc2626" : "#d97706" }}>
              {high ? t("highRisk") : t("caution")}
            </Text>
          </View>
          {conflict.verified_by_ai ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: hs(4), paddingHorizontal: hs(8), paddingVertical: vs(3), borderRadius: hs(10), backgroundColor: "#e0f2fe" }}>
              <MaterialCommunityIcons name="robot-outline" size={hs(12)} color="#0284c7" />
              <Text style={{ fontSize: fontScale(10), fontWeight: "700", color: "#0284c7" }}>{t("aiVerified")}</Text>
            </View>
          ) : null}
        </View>
        {conflict.reason ? (
          <Text style={{ fontSize: fontScale(12), lineHeight: fontScale(16), marginTop: vs(6), color: theme.onSurfaceVariant }}>
            {conflict.reason}
          </Text>
        ) : null}
      </View>
    );
  };

  return (
    <View
      style={{
        backgroundColor: style.bg,
        borderRadius: hs(16),
        borderLeftWidth: 4,
        borderLeftColor: style.accent,
        padding: hs(16),
        marginBottom: vs(24),
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: hs(8), marginBottom: vs(10) }}>
        <MaterialCommunityIcons name={style.icon} size={hs(22)} color={style.accent} />
        <Text style={{ fontSize: fontScale(15), fontWeight: "700", color: style.accent }}>
          {t("interactionCheck")}
        </Text>
      </View>

      {isError ? (
        <Text style={{ fontSize: fontScale(13), lineHeight: fontScale(18), color: theme.onSurfaceVariant }}>
          {t("interactionCheckUnavailableDesc")}
        </Text>
      ) : conflicts.length > 0 ? (
        <>
          <Text style={{ fontSize: fontScale(13), fontWeight: "700", marginBottom: vs(8), color: theme.onSurface }}>
            {t("interactionsDetected")}
          </Text>
          {conflicts.map(renderConflict)}
          {payload.message ? (
            <Text style={{ fontSize: fontScale(12), color: theme.onSurfaceVariant, marginBottom: vs(4) }}>
              {payload.message}
            </Text>
          ) : null}
        </>
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: hs(8) }}>
          <MaterialCommunityIcons name="shield-check" size={hs(18)} color={style.accent} />
          <Text style={{ fontSize: fontScale(14), fontWeight: "700", color: style.accent }}>
            {t("noInteractionsFound")}
          </Text>
        </View>
      )}

      <Text style={{ fontSize: fontScale(10), lineHeight: fontScale(15), marginTop: vs(10), color: theme.onSurfaceVariant }}>
        {t("advisoryNote")}
      </Text>
    </View>
  );
}
