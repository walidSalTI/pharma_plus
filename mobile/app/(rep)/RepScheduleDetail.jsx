import { useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRepSchedules } from "@/hooks/useRepSchedules";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useResponsive } from "@/constants/responsive";

export default function RepScheduleDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const { hs, vs, fontScale } = useResponsive();
  const { scheduleDetail, detailLoading, fetchDetail } = useRepSchedules();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (id) fetchDetail(id);
  }, [id, fetchDetail]);

  const [isTimeReached, setIsTimeReached] = useState(false);

  useEffect(() => {
    if (!scheduleDetail?.scheduled_at) return;

    const check = () => setIsTimeReached(new Date(scheduleDetail.scheduled_at) <= new Date());
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [scheduleDetail?.scheduled_at]);

  const doctor = scheduleDetail?.doctor;
  const workplaces = doctor?.workplaces || [];
  const doctorName = doctor?.name || doctor?.f_name || "Unknown Doctor";
  const initials = doctorName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const scheduledTime = scheduleDetail?.scheduled_at
    ? new Date(scheduleDetail.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";
  const scheduledDate = scheduleDetail?.scheduled_at
    ? new Date(scheduleDetail.scheduled_at).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })
    : "";

  const openInMaps = (lat, lng) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url);
  };

  if (detailLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.surface }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.surface }}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + vs(40) }}>
        <LinearGradient
          colors={[theme.primary, theme.primaryDim || theme.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop: insets.top + vs(12),
            paddingBottom: vs(32),
            borderBottomLeftRadius: hs(32),
            borderBottomRightRadius: hs(32),
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: hs(24),
              height: vs(52),
            }}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: hs(40),
                height: hs(40),
                borderRadius: hs(20),
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255,255,255,0.15)",
              }}
            >
              <MaterialCommunityIcons name="arrow-left" size={hs(22)} color="#ffffff" />
            </TouchableOpacity>
            <Text
              style={{
                fontSize: fontScale(20),
                fontWeight: "700",
                marginLeft: hs(16),
                color: "#ffffff",
              }}
            >
              {t("schedules")}
            </Text>
          </View>

          <View style={{ paddingHorizontal: hs(24), alignItems: "center" }}>
              <View
                style={{
                  width: hs(96),
                  height: hs(96),
                  borderRadius: hs(48),
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "rgba(255,255,255,0.2)",
                  borderWidth: 3,
                  borderColor: "rgba(255,255,255,0.4)",
                }}
              >
                <Text style={{ fontSize: fontScale(32), fontWeight: "800", color: "#ffffff" }}>
                  {initials}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: fontScale(24),
                  fontWeight: "800",
                  color: "#ffffff",
                  marginTop: vs(16),
                  letterSpacing: -0.3,
                }}
              >
                {doctorName}
              </Text>
              {doctor?.specialization && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: hs(6),
                    marginTop: vs(8),
                    paddingHorizontal: hs(16),
                    paddingVertical: vs(6),
                    borderRadius: hs(20),
                    backgroundColor: "rgba(255,255,255,0.2)",
                  }}
                >
                  <MaterialCommunityIcons name="stethoscope" size={hs(14)} color="#ffffff" />
                  <Text style={{ fontSize: fontScale(13), color: "#ffffff", fontWeight: "700", textTransform: "capitalize" }}>
                    {doctor.specialization}
                  </Text>
                </View>
              )}
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: hs(20),
                marginTop: vs(24),
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: hs(6) }}>
                <MaterialCommunityIcons name="clock-outline" size={hs(16)} color="rgba(255,255,255,0.8)" />
                <Text style={{ fontSize: fontScale(15), fontWeight: "600", color: "#ffffff" }}>
                  {scheduledTime}
                </Text>
              </View>
              {scheduledDate ? (
                <>
                  <View style={{ width: hs(1), height: vs(16), backgroundColor: "rgba(255,255,255,0.3)" }} />
                  <View style={{ flexDirection: "row", alignItems: "center", gap: hs(6) }}>
                    <MaterialCommunityIcons name="calendar-outline" size={hs(16)} color="rgba(255,255,255,0.8)" />
                    <Text style={{ fontSize: fontScale(15), fontWeight: "600", color: "#ffffff" }}>
                      {scheduledDate}
                    </Text>
                  </View>
                </>
              ) : null}
            </View>
          </LinearGradient>

          <View style={{ paddingHorizontal: hs(24), paddingTop: vs(24) }}>
            {workplaces.length > 0 && (
              <View>
                <Text
                  style={{
                    fontSize: fontScale(10),
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: vs(12),
                    color: theme.onSurfaceVariant,
                  }}
                >
                  {t("workplaces")}
                </Text>
                {workplaces.map((wp) => (
                  <View
                    key={wp.id}
                    style={{
                      padding: hs(16),
                      borderRadius: hs(14),
                      backgroundColor: theme.surfaceContainerLowest,
                      borderWidth: 1.5,
                      borderColor: theme.outlineVariant,
                      marginBottom: vs(10),
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: hs(12) }}>
                      <View
                        style={{
                          width: hs(44),
                          height: hs(44),
                          borderRadius: hs(12),
                          justifyContent: "center",
                          alignItems: "center",
                          backgroundColor: theme.primaryContainer,
                          borderWidth: 1,
                          borderColor: theme.primary + "30",
                        }}
                      >
                        <MaterialCommunityIcons name="office-building" size={hs(20)} color={theme.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: fontScale(15), fontWeight: "700", color: theme.onSurface }}>
                          {wp.place_name}
                        </Text>
                        <Text style={{ fontSize: fontScale(12), color: theme.onSurfaceVariant, textTransform: "capitalize", marginTop: vs(2) }}>
                          {wp.place_type}
                        </Text>
                      </View>
                    </View>
                    {wp.latitude && wp.longitude && (
                      <TouchableOpacity
                        onPress={() => openInMaps(wp.latitude, wp.longitude)}
                        activeOpacity={0.7}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                      gap: hs(6),
                      marginTop: vs(12),
                      paddingVertical: vs(8),
                      borderRadius: hs(10),
                      borderWidth: 1,
                      borderColor: theme.primary + "40",
                          backgroundColor: theme.primaryContainer + "30",
                        }}
                      >
                        <MaterialCommunityIcons name="directions" size={hs(14)} color={theme.primary} />
                        <Text style={{ fontSize: fontScale(12), fontWeight: "700", color: theme.primary }}>
                          {t("openInMaps")}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}

            {scheduleDetail?.status === "upcoming" && isTimeReached && (
              <TouchableOpacity
                onPress={() => router.push({ pathname: "/(rep)/RepQRScanner", params: { scheduleId: scheduleDetail.id, doctorId: doctor?.id } })}
                activeOpacity={0.8}
                style={{
                  marginTop: vs(28),
                  height: vs(56),
                  borderRadius: hs(16),
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: theme.primary,
                  gap: hs(10),
                  shadowColor: theme.primary,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.35,
                  shadowRadius: 14,
                  elevation: 8,
                }}
              >
                <MaterialCommunityIcons name="qrcode-scan" size={hs(20)} color="white" />
                <Text style={{ fontSize: fontScale(16), fontWeight: "700", color: "white" }}>
                  {t("checkInNow")}
                </Text>
                <MaterialCommunityIcons name="arrow-right" size={hs(18)} color="white" />
              </TouchableOpacity>
            )}

            {scheduleDetail?.status === "upcoming" && !isTimeReached && (
              <View
                style={{
                  marginTop: vs(28),
                  borderRadius: hs(16),
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: vs(56),
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: theme.surfaceContainerLow,
                    gap: hs(10),
                    opacity: 0.6,
                  }}
                >
                  <MaterialCommunityIcons name="qrcode-scan" size={hs(20)} color={theme.onSurfaceVariant} />
                  <Text style={{ fontSize: fontScale(16), fontWeight: "700", color: theme.onSurfaceVariant }}>
                    {t("checkInNow")}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: hs(6),
                    paddingVertical: vs(10),
                    backgroundColor: theme.surfaceContainerLow,
                  }}
                >
                  <MaterialCommunityIcons name="clock-outline" size={hs(14)} color={theme.onSurfaceVariant} />
                  <Text style={{ fontSize: fontScale(13), fontWeight: "600", color: theme.onSurfaceVariant }}>
                    {t("checkInAvailableAt", { time: scheduledTime })}
                  </Text>
                </View>
              </View>
            )}

            {scheduleDetail?.status === "completed" && (
              <View
                style={{
                  marginTop: vs(28),
                  height: vs(56),
                  borderRadius: hs(16),
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#059669",
                  gap: hs(10),
                }}
              >
                <MaterialCommunityIcons name="check-circle-outline" size={hs(20)} color="white" />
                <Text style={{ fontSize: fontScale(16), fontWeight: "700", color: "white" }}>
                  {t("completed")}
                </Text>
              </View>
            )}

            {scheduleDetail?.status === "cancelled" && (
              <View
                style={{
                  marginTop: vs(28),
                  height: vs(56),
                  borderRadius: hs(16),
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#dc2626",
                  gap: hs(10),
                }}
              >
                <MaterialCommunityIcons name="close-circle-outline" size={hs(20)} color="white" />
                <Text style={{ fontSize: fontScale(16), fontWeight: "700", color: "white" }}>
                  {t("cancelled")}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
    </View>
  );
}
