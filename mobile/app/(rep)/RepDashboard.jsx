import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import tw from "twrnc";
import RepBottomNavBar from "@/components/RepBottomNavBar";
import RepScheduleCard from "@/components/RepScheduleCard";
import ErrorState from "@/components/ErrorState";
import { useRepDashboard } from "@/hooks/useRepDashboard";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useResponsive } from "@/constants/responsive";

const getGreeting = (t) => {
  const hour = new Date().getHours();
  if (hour < 12) return t("goodMorning");
  if (hour < 17) return t("goodAfternoon");
  return t("goodEvening");
};

export default function RepDashboard() {
  const { t } = useLanguage();
  const { theme, isDark } = useAppTheme();
  const { hs, vs, fontScale } = useResponsive();
  const router = useRouter();
  const { rep, todaySchedules, weeklyOverview, loading, refresh, error } = useRepDashboard();

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
              style={{
                width: hs(36),
                height: hs(36),
                borderRadius: hs(18),
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: theme.primaryContainer,
              }}
            >
              <MaterialCommunityIcons name="briefcase" size={hs(20)} color={theme.primary} />
            </View>
            <Text
              style={{
                fontSize: fontScale(24),
                fontWeight: "800",
                letterSpacing: -0.5,
                color: theme.primary,
              }}
            >
              Pharma Plus
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: hs(24), paddingBottom: vs(192) }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={theme.primary} />}
        >
          <View style={{ marginTop: vs(24) }}>
            <Text style={{ fontSize: fontScale(32), fontWeight: "800", letterSpacing: -0.5, color: theme.onSurface }}>
              {getGreeting(t)}
            </Text>
            {rep?.name && (
              <Text style={{ fontSize: fontScale(16), marginTop: vs(4), color: theme.onSurfaceVariant }}>
                {rep.name}
              </Text>
            )}
            {rep?.company && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: hs(8), marginTop: vs(8) }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: hs(12), paddingVertical: vs(4), borderRadius: hs(12), backgroundColor: theme.primaryContainer + "60" }}>
                  <MaterialCommunityIcons name="domain" size={hs(14)} color={theme.primary} />
                  <Text style={{ fontSize: fontScale(13), fontWeight: "600", color: theme.primary }}>
                    {rep.company}
                  </Text>
                </View>
              </View>
            )}
          </View>

          <View style={{ marginTop: vs(24) }}>
            <Text style={{ fontSize: fontScale(10), fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: vs(12), color: theme.onSurfaceVariant }}>
              {t("todayVisits")}
            </Text>
            {loading ? (
              <ActivityIndicator size="large" color={theme.primary} style={tw`mt-10`} />
            ) : error ? (
              <ErrorState message={t("couldNotLoad")} onRetry={refresh} />
            ) : todaySchedules.length === 0 ? (
              <View style={{ padding: hs(24), borderRadius: hs(16), backgroundColor: theme.surfaceContainerLow, alignItems: "center" }}>
                <MaterialCommunityIcons name="calendar-blank-outline" size={hs(48)} color={theme.outlineVariant} />
                <Text style={{ fontSize: fontScale(16), fontWeight: "600", color: theme.onSurfaceVariant, marginTop: vs(12) }}>
                  {t("noVisitsToday")}
                </Text>
                <Text style={{ fontSize: fontScale(13), color: theme.onSurfaceVariant, marginTop: vs(4), textAlign: "center" }}>
                  {t("noVisitsTodayDesc")}
                </Text>
              </View>
            ) : (
              todaySchedules.map((schedule) => (
                <RepScheduleCard key={schedule.id} schedule={schedule} onPress={() => {}} />
              ))
            )}
          </View>

          <View style={{ marginTop: vs(24) }}>
            <Text style={{ fontSize: fontScale(10), fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: vs(12), color: theme.onSurfaceVariant }}>
              {t("weeklyOverview")}
            </Text>
            <View style={{ flexDirection: "row", gap: hs(10) }}>
              {[
                { label: t("completed"), value: weeklyOverview.completed || 0, icon: "check-circle", colors: ["#059669", "#34d399"], filter: "completed" },
                { label: t("pending"), value: weeklyOverview.upcoming || 0, icon: "clock-fast", colors: ["#d97706", "#fbbf24"], filter: "upcoming" },
                { label: t("totalVisits"), value: (weeklyOverview.completed || 0) + (weeklyOverview.upcoming || 0) + (weeklyOverview.cancelled || 0), icon: "calendar-month", colors: [theme.primaryDim || theme.primary, theme.primary], filter: "all" },
              ].map((item) => (
                <TouchableOpacity
                  key={item.label}
                  activeOpacity={0.7}
                  onPress={() => router.push({ pathname: "/(rep)/RepScheduleList", params: { filter: item.filter } })}
                  style={{
                    flex: 1,
                    paddingVertical: vs(16),
                    paddingHorizontal: hs(8),
                    borderRadius: hs(20),
                    alignItems: "center",
                    backgroundColor: item.colors[0],
                  }}
                >
                  <View style={{ width: hs(32), height: hs(32), borderRadius: hs(16), justifyContent: "center", alignItems: "center", backgroundColor: "rgba(255,255,255,0.25)", marginBottom: vs(10) }}>
                    <MaterialCommunityIcons name={item.icon} size={hs(16)} color="#ffffff" />
                  </View>
                  <Text style={{ fontSize: fontScale(26), fontWeight: "900", color: "#ffffff" }}>
                    {item.value}
                  </Text>
                  <Text style={{ fontSize: fontScale(10), fontWeight: "700", color: "rgba(255,255,255,0.85)", marginTop: vs(4), textTransform: "capitalize" }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <View style={tw`absolute bottom-0 left-0 right-0 z-50`}>
        <RepBottomNavBar activeTab="Dashboard" />
      </View>
    </View>
  );
}
