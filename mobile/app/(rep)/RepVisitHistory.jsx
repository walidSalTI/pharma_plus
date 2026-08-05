import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useMemo } from "react";
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
import RepVisitCard from "@/components/RepVisitCard";
import ErrorState from "@/components/ErrorState";
import { useRepVisits } from "@/hooks/useRepVisits";
import { useRepSchedules } from "@/hooks/useRepSchedules";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useResponsive } from "@/constants/responsive";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function groupByMonth(visits) {
  const groups = {};
  visits.forEach((visit) => {
    const dateStr = visit?.scanned_at || visit?.created_at;
    if (!dateStr) return;
    const d = new Date(dateStr);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
    if (!groups[key]) groups[key] = { label, visits: [] };
    groups[key].visits.push(visit);
  });
  return Object.values(groups);
}

export default function RepVisitHistory() {
  const { t } = useLanguage();
  const { theme, isDark } = useAppTheme();
  const { hs, vs, fontScale } = useResponsive();
  const router = useRouter();
  const { visits, stats, loading, loadingMore, hasMore, error, loadMore, refresh } = useRepVisits();
  const { schedules } = useRepSchedules();

  const specMap = useMemo(() => {
    const map = {};
    schedules.forEach((s) => {
      const doc = s?.doctor;
      if (doc?.id && doc?.specialization) {
        map[doc.id] = doc.specialization;
      }
    });
    return map;
  }, [schedules]);

  const grouped = useMemo(() => groupByMonth(visits), [visits]);

  const handleVisitPress = useCallback((visit) => {
    // optional: navigate to visit detail
  }, []);

  return (
    <View style={[tw`flex-1`, { backgroundColor: theme.surface }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: hs(24),
            paddingVertical: vs(14),
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: hs(12) }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: hs(40),
                height: hs(40),
                borderRadius: hs(999),
                backgroundColor: theme.surfaceContainerLow,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <MaterialCommunityIcons name="arrow-left" size={hs(22)} color={theme.onSurface} />
            </TouchableOpacity>
            <Text style={{ fontSize: fontScale(20), fontWeight: "700", color: theme.onSurface, letterSpacing: -0.3 }}>
              {t("history")}
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: hs(24), paddingBottom: vs(192) }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={theme.primary} />}
        >
          {stats && (
            <View style={{ marginTop: vs(20), flexDirection: "row", flexWrap: "wrap", gap: hs(10) }}>
              {[
                { label: t("totalRecorded"), value: stats.total_visits || 0, icon: "calendar-month", color: theme.primary, bg: theme.primaryContainer + "40", iconBg: theme.primaryContainer + "80" },
                { label: t("verifiedVisits"), value: stats.verified_visits || 0, icon: "check-decagram", color: "#059669", bg: "#ecfdf5", iconBg: "#d1fae5" },
                { label: t("failedVisits"), value: stats.failed_visits || 0, icon: "alert-circle-outline", color: "#dc2626", bg: "#fef2f2", iconBg: "#fee2e2" },
                { label: t("adherenceRate"), value: `${stats.adherence_rate || 0}%`, icon: "chart-line", color: "#d97706", bg: "#fffbeb", iconBg: "#fef3c7" },
              ].map((item) => (
                <View
                  key={item.label}
                  style={{
                    width: "48%",
                    flexGrow: 1,
                    padding: hs(12),
                    borderRadius: hs(14),
                    backgroundColor: item.bg,
                    alignItems: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <View style={{ width: hs(36), height: hs(36), borderRadius: hs(10), justifyContent: "center", alignItems: "center", backgroundColor: item.iconBg, marginBottom: vs(8) }}>
                    <MaterialCommunityIcons name={item.icon} size={hs(18)} color={item.color} />
                  </View>
                  <Text style={{ fontSize: fontScale(22), fontWeight: "800", color: item.color }}>
                    {item.value}
                  </Text>
                  <Text style={{ fontSize: fontScale(10), fontWeight: "600", color: item.color, marginTop: vs(2), textAlign: "center" }}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ marginTop: vs(12) }}>
            {loading ? (
              <ActivityIndicator size="large" color={theme.primary} style={tw`mt-10`} />
            ) : error ? (
              <ErrorState message={t("couldNotLoad")} onRetry={refresh} />
            ) : visits.length === 0 ? (
              <View style={{ padding: hs(24), borderRadius: hs(16), backgroundColor: theme.surfaceContainerLow, alignItems: "center" }}>
                <MaterialCommunityIcons name="history" size={hs(48)} color={theme.outlineVariant} />
                <Text style={{ fontSize: fontScale(16), fontWeight: "600", color: theme.onSurfaceVariant, marginTop: vs(12) }}>
                  {t("noSchedules")}
                </Text>
              </View>
            ) : (
              grouped.map((group) => (
                <View key={group.label} style={{ marginBottom: vs(24) }}>
                  <Text
                    style={{
                      fontSize: fontScale(11),
                      fontWeight: "700",
                      letterSpacing: 1.5,
                      textTransform: "uppercase",
                      color: theme.onSurfaceVariant,
                      paddingLeft: hs(8),
                      marginBottom: vs(12),
                    }}
                  >
                    {group.label}
                  </Text>
                  {group.visits.map((visit) => (
                    <RepVisitCard
                      key={visit.id}
                      visit={visit}
                      specialization={specMap[visit.doctor_id]}
                      onPress={handleVisitPress}
                    />
                  ))}
                </View>
              ))
            )}

            {hasMore && (
              <TouchableOpacity
                onPress={loadMore}
                disabled={loadingMore || loading}
                style={{
                  paddingVertical: vs(14),
                  borderRadius: hs(16),
                  borderWidth: 1,
                  borderColor: theme.primary,
                  alignItems: "center",
                  marginTop: vs(8),
                }}
              >
                {loadingMore ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <Text style={{ fontSize: fontScale(14), fontWeight: "700", color: theme.primary }}>
                    {t("loadMore")}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      <View style={tw`absolute bottom-0 left-0 right-0 z-50`}>
        <RepBottomNavBar activeTab="History" />
      </View>
    </View>
  );
}
