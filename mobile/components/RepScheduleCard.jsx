import { memo } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useResponsive } from "@/constants/responsive";

const STATUS_CONFIG = {
  upcoming: { color: "#0b6a6a", bg: "#e0f5f5", accent: "#0b6a6a", icon: "clock-outline", label: "upcoming" },
  completed: { color: "#059669", bg: "#ecfdf5", accent: "#059669", icon: "check-circle-outline", label: "completed" },
  cancelled: { color: "#dc2626", bg: "#fef2f2", accent: "#dc2626", icon: "close-circle-outline", label: "cancelled" },
  planned: { color: "#d97706", bg: "#fffbeb", accent: "#d97706", icon: "calendar-clock", label: "planned" },
};

const SHADOW = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 3,
};

function RepScheduleCard({ schedule, onPress }) {
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const { hs, vs, fontScale } = useResponsive();

  const doctor = schedule?.doctor;
  const doctorName = doctor?.name || doctor?.f_name || "Unknown Doctor";
  const initials = doctorName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const status = STATUS_CONFIG[schedule?.status] || STATUS_CONFIG.upcoming;
  const scheduledTime = schedule?.scheduled_at
    ? new Date(schedule.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";
  const scheduledDate = schedule?.scheduled_at
    ? new Date(schedule.scheduled_at).toLocaleDateString([], { month: "short", day: "numeric" })
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
      <View style={{ width: hs(4), backgroundColor: status.accent }} />

      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", padding: hs(16), gap: hs(14) }}>
        <View
          style={{
            width: hs(48),
            height: hs(48),
            borderRadius: hs(14),
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: status.bg,
          }}
        >
          <Text style={{ fontSize: fontScale(16), fontWeight: "800", color: status.color }}>
            {initials}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: fontScale(15), fontWeight: "700", color: theme.onSurface }} numberOfLines={1}>
            {doctorName}
          </Text>
          {doctor?.specialization && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: vs(2) }}>
              <MaterialCommunityIcons name="stethoscope" size={hs(12)} color={theme.onSurfaceVariant} />
              <Text style={{ fontSize: fontScale(12), color: theme.onSurfaceVariant, textTransform: "capitalize" }}>
                {doctor.specialization}
              </Text>
            </View>
          )}
          <View style={{ flexDirection: "row", alignItems: "center", gap: hs(10), marginTop: vs(6) }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <MaterialCommunityIcons name="clock-outline" size={hs(13)} color={theme.onSurfaceVariant} />
              <Text style={{ fontSize: fontScale(13), fontWeight: "600", color: theme.onSurface }}>
                {scheduledTime}
              </Text>
            </View>
            {scheduledDate ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <MaterialCommunityIcons name="calendar-outline" size={hs(13)} color={theme.onSurfaceVariant} />
                <Text style={{ fontSize: fontScale(13), color: theme.onSurfaceVariant }}>
                  {scheduledDate}
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
            backgroundColor: status.bg,
          }}
        >
          <MaterialCommunityIcons name={status.icon} size={hs(14)} color={status.color} />
          <Text style={{ fontSize: fontScale(11), fontWeight: "700", color: status.color, textTransform: "capitalize" }}>
            {t(status.label)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default memo(RepScheduleCard);
