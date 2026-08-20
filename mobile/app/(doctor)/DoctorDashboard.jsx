import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import tw from "twrnc";
import DoctorBottomNavBar from "@/components/DoctorBottomNavBar";
import TotpQrDisplay from "@/components/TotpQrDisplay";
import { useTotpQr } from "@/hooks/useTotpQr";
import { useDoctorProfile } from "@/hooks/useDoctorProfile";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useResponsive } from "@/constants/responsive";
import { useExitPrompt } from "@/hooks/useExitPrompt";

export default function DoctorDashboard() {
  const { t } = useLanguage();
  const { theme, isDark } = useAppTheme();
  const { hs, vs, fontScale } = useResponsive();
  const { exitModal } = useExitPrompt();
  const { profile, loading: profileLoading } = useDoctorProfile();
  const { payload, timeRemaining, isActive, error, refresh } = useTotpQr(profile?.id);
  return (
    <View style={[tw`flex-1`, { backgroundColor: theme.surface }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView style={{ flex: 1 }}>
        <View
          style={[
            tw`flex-row items-center justify-between`,
            {
              paddingHorizontal: hs(24),
              backgroundColor: isDark ? theme.surface : "rgba(255,255,255,0.8)",
              minHeight: vs(64),
            },
          ]}
        >
          <View style={[tw`flex-row items-center`, { gap: hs(12) }]}>
            <View
              style={[
                {
                  width: hs(36),
                  height: hs(36),
                  borderRadius: hs(18),
                  justifyContent: "center",
                  alignItems: "center",
                },
                { backgroundColor: theme.primaryContainer },
              ]}
            >
              <MaterialCommunityIcons name="stethoscope" size={hs(20)} color={theme.primary} />
            </View>
            <Text
              style={[
                { fontSize: fontScale(24), fontWeight: "800", letterSpacing: -0.5 },
                { color: theme.primary },
              ]}
            >
              Pharma Plus
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: hs(24), paddingBottom: vs(192) }}>
          <View style={{ marginTop: vs(24) }}>
            <Text
              style={[
                { fontSize: fontScale(36), fontWeight: "800", letterSpacing: -0.5 },
                { color: theme.onSurface },
              ]}
            >
              {t("doctorDashboard")}
            </Text>
            <Text
              style={[
                { fontSize: fontScale(16), marginTop: vs(4), maxWidth: hs(300) },
                { color: theme.onSurfaceVariant },
              ]}
            >
              {t("doctorDashboardSubtitle")}
            </Text>
          </View>

          {profileLoading ? (
            <ActivityIndicator size="large" color={theme.primary} style={tw`mt-20`} />
          ) : (
            <>
              <View style={{ marginTop: vs(24) }}>
                <TotpQrDisplay payload={payload} timeRemaining={timeRemaining} isActive={isActive} error={error} />
                <TouchableOpacity
                  onPress={refresh}
                  style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: hs(6), marginTop: vs(12), paddingVertical: vs(10), borderRadius: hs(12), backgroundColor: theme.surfaceContainerLow }}
                >
                  <MaterialCommunityIcons name="refresh" size={hs(18)} color={theme.primary} />
                  <Text style={{ fontSize: fontScale(13), fontWeight: "700", color: theme.primary }}>{t("refresh")}</Text>
                </TouchableOpacity>
              </View>

              {profile?.workplaces && profile.workplaces.length > 0 && (
                <View style={{ marginTop: vs(24) }}>
                  <Text style={{ fontSize: fontScale(10), fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: vs(12), color: theme.onSurfaceVariant }}>
                    {t("workLocations")}
                  </Text>
                  {profile.workplaces.map((wp, index) => {
                    const iconName = wp.place_type === "Hospital" ? "hospital-box" : wp.place_type === "Clinic" ? "office-building" : "domain";
                    return (
                      <View
                        key={wp.id || index}
                        style={{
                          padding: hs(16),
                          borderRadius: hs(16),
                          flexDirection: "row",
                          alignItems: "center",
                          gap: hs(12),
                          marginBottom: index < profile.workplaces.length - 1 ? vs(8) : 0,
                          backgroundColor: theme.surfaceContainerLowest,
                          borderWidth: 1,
                          borderColor: theme.outlineVariant,
                        }}
                      >
                        <MaterialCommunityIcons name={iconName} size={hs(24)} color={theme.primary} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: fontScale(16), fontWeight: "700", color: theme.onSurface }}>
                            {wp.place_name}
                          </Text>
                          <Text style={{ fontSize: fontScale(12), color: theme.onSurfaceVariant, textTransform: "capitalize" }}>
                            {wp.place_type}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              <View
                style={{
                  marginTop: vs(24),
                  padding: hs(16),
                  borderRadius: hs(16),
                  flexDirection: "row",
                  alignItems: "center",
                  gap: hs(12),
                  backgroundColor: isActive ? "#ecfdf5" : theme.surfaceContainerLow,
                  borderWidth: 1,
                  borderColor: isActive ? "#a7f3d0" : theme.outlineVariant,
                }}
              >
                <View
                  style={{
                    width: hs(10),
                    height: hs(10),
                    borderRadius: hs(5),
                    backgroundColor: isActive ? "#10b981" : "#f59e0b",
                  }}
                />
                <Text style={{ fontSize: fontScale(14), fontWeight: "600", color: isActive ? "#059669" : theme.onSurfaceVariant }}>
                  {isActive ? t("verificationActive") : t("waitingForVerification")}
                </Text>
              </View>

              <View
                style={{
                  marginTop: vs(16),
                  padding: hs(16),
                  borderRadius: hs(16),
                  flexDirection: "row",
                  alignItems: "center",
                  gap: hs(12),
                  backgroundColor: theme.surfaceContainerLow,
                }}
              >
                <MaterialCommunityIcons name="information-outline" size={hs(20)} color={theme.onSurfaceVariant} />
                <Text style={{ fontSize: fontScale(13), color: theme.onSurfaceVariant, flex: 1 }}>
                  {t("qrInstructions")}
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      <View style={tw`absolute bottom-0 left-0 right-0 z-50`}>
        <DoctorBottomNavBar activeTab="Dashboard" />
      </View>
      {exitModal}
    </View>
  );
}
