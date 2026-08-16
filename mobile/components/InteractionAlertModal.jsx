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
  const conflicts = Array.isArray(payload.conflicts) ? payload.conflicts : [];
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

          {isError ? (
            <>
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
              <Text style={{ fontSize: fontScale(13), lineHeight: fontScale(18), marginBottom: vs(12), color: theme.onSurfaceVariant }}>
                {t("interactionCheckUnavailableDesc")}
              </Text>
            </>
          ) : conflicts.length > 0 ? (
            <>
              <Text style={{ fontSize: fontScale(14), fontWeight: "700", marginBottom: vs(8), color: theme.onSurface }}>
                {t("interactionsDetected")}
              </Text>
              <ScrollView style={{ maxHeight: vs(200), marginBottom: vs(12) }} showsVerticalScrollIndicator={false}>
                {conflicts.map((conflict, idx) => {
                  const high = Number(conflict.risk_level) >= RANKS.HIGH;
                  const pairColor = high ? "#dc2626" : theme.primary;
                  return (
                    <View
                      key={idx}
                      style={{
                        padding: hs(12),
                        borderRadius: hs(12),
                        marginBottom: vs(8),
                        backgroundColor: theme.surfaceContainerLow,
                        borderLeftWidth: 3,
                        borderLeftColor: high ? "#dc2626" : "#d97706",
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: hs(6) }}>
                        <MaterialCommunityIcons name="pill" size={hs(16)} color={pairColor} />
                        <Text style={{ fontSize: fontScale(14), fontWeight: "700", color: theme.onSurface, flexShrink: 1 }}>
                          {conflict.drug1}
                        </Text>
                        <Text style={{ fontSize: fontScale(13), color: theme.onSurfaceVariant }}>×</Text>
                        <MaterialCommunityIcons name="pill" size={hs(16)} color={pairColor} />
                        <Text style={{ fontSize: fontScale(14), fontWeight: "700", color: theme.onSurface, flexShrink: 1 }}>
                          {conflict.drug2}
                        </Text>
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
                })}
              </ScrollView>
            </>
          ) : (
            <>
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
              {payload.message ? (
                <Text style={{ fontSize: fontScale(13), marginBottom: vs(12), color: theme.onSurfaceVariant }}>
                  {payload.message}
                </Text>
              ) : null}
            </>
          )}

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
