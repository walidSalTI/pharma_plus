import { memo } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useResponsive } from "@/constants/responsive";

const VERIFY_CONFIG = {
  verified: { color: "#059669", bg: "#ecfdf5", icon: "check-decagram", label: "verified" },
  failed: { color: "#dc2626", bg: "#fef2f2", icon: "alert-circle-outline", label: "failed" },
  pending: { color: "#d97706", bg: "#fffbeb", icon: "clock-outline", label: "pending" },
};

const SHADOW = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 3,
};

function RepVisitCard({ visit, specialization, onPress }) {
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const { hs, vs, fontScale } = useResponsive();

  const isVerified = visit?.verification_status === true;
  const isFailed = visit?.status === "failed";
  const verifyStatus = isVerified ? "verified" : isFailed ? "failed" : "pending";
  const verifyConfig = VERIFY_CONFIG[verifyStatus];

  const doctorName = visit?.doctor_name || "Unknown";
  const initials = doctorName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const visitDate = visit?.scanned_at || visit?.created_at;
  const formattedDate = visitDate
    ? new Date(visitDate).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })
    : "";
  const formattedTime = visitDate
    ? new Date(visitDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "stretch",
        borderRadius: hs(16),
        backgroundColor: theme.surfaceContainerLowest,
        marginBottom: vs(10),
        overflow: "hidden",
        ...SHADOW,
      }}
    >
      <View style={{ width: hs(4), backgroundColor: verifyConfig.color }} />

      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", padding: hs(16), gap: hs(14) }}>
        <View
          style={{
            width: hs(48),
            height: hs(48),
            borderRadius: hs(14),
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: verifyConfig.bg,
          }}
        >
          <Text style={{ fontSize: fontScale(16), fontWeight: "800", color: verifyConfig.color }}>
            {initials}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: fontScale(15), fontWeight: "700", color: theme.onSurface }} numberOfLines={1}>
            {doctorName}
          </Text>
          {specialization ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: vs(2) }}>
              <MaterialCommunityIcons name="stethoscope" size={hs(12)} color={theme.onSurfaceVariant} />
              <Text style={{ fontSize: fontScale(12), color: theme.onSurfaceVariant, textTransform: "capitalize" }}>
                {specialization}
              </Text>
            </View>
          ) : null}
          <View style={{ flexDirection: "row", alignItems: "center", gap: hs(10), marginTop: vs(6) }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <MaterialCommunityIcons name="calendar-outline" size={hs(13)} color={theme.onSurfaceVariant} />
              <Text style={{ fontSize: fontScale(13), fontWeight: "600", color: theme.onSurface }}>
                {formattedDate}
              </Text>
            </View>
            {formattedTime ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <MaterialCommunityIcons name="clock-outline" size={hs(13)} color={theme.onSurfaceVariant} />
                <Text style={{ fontSize: fontScale(13), color: theme.onSurfaceVariant }}>
                  {formattedTime}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingHorizontal: hs(10),
            paddingVertical: vs(6),
            borderRadius: hs(8),
            backgroundColor: verifyConfig.bg,
          }}
        >
          <MaterialCommunityIcons name={verifyConfig.icon} size={hs(14)} color={verifyConfig.color} />
          <Text style={{ fontSize: fontScale(11), fontWeight: "700", color: verifyConfig.color, textTransform: "capitalize" }}>
            {t(verifyConfig.label)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default memo(RepVisitCard);
