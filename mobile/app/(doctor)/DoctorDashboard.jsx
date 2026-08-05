import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Text,
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

export default function DoctorDashboard() {
  const { t } = useLanguage();
  const { theme, isDark } = useAppTheme();
  const { hs, vs, fontScale } = useResponsive();
  const { profile, loading: profileLoading } = useDoctorProfile();
  const { payload, timeRemaining, isActive, error } = useTotpQr(profile?.id);

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
              </View>

              {profile?.workplaces && profile.workplaces.length > 0 && (
                <View style={{ marginTop: vs(24) }}>
                  <Text style={{ fontSize: fontScale(10), fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: vs(12), color: theme.onSurfaceVariant }}>
                    {t("activeWorkplace")}
                  </Text>
                  <View
                    style={{
                      padding: hs(16),
                      borderRadius: hs(16),
                      flexDirection: "row",
                      alignItems: "center",
                      gap: hs(12),
                      backgroundColor: theme.surfaceContainerLowest,
                      borderWidth: 1,
                      borderColor: theme.outlineVariant,
                    }}
                  >
                    <MaterialCommunityIcons name="hospital-box" size={hs(24)} color={theme.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: fontScale(16), fontWeight: "700", color: theme.onSurface }}>
                        {profile.workplaces[0].place_name}
                      </Text>
                      <Text style={{ fontSize: fontScale(12), color: theme.onSurfaceVariant, textTransform: "capitalize" }}>
                        {profile.workplaces[0].place_type}
                      </Text>
                    </View>
                    <MaterialCommunityIcons name="check-circle" size={hs(20)} color="#10b981" />
                  </View>
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
    </View>
  );
}
