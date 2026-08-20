import { useCallback, useEffect, useMemo, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import tw from "twrnc";
import RepBottomNavBar from "@/components/RepBottomNavBar";
import RepScheduleCard from "@/components/RepScheduleCard";
import ErrorState from "@/components/ErrorState";
import { useRepSchedules } from "@/hooks/useRepSchedules";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useResponsive } from "@/constants/responsive";

const FILTERS = ["all", "upcoming", "completed", "cancelled"];

function FilterBar({ activeFilter, setActiveFilter, theme, hs, vs, fontScale, t }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: hs(8), paddingVertical: vs(12) }}>
      {FILTERS.map((f) => (
        <TouchableOpacity
          key={f}
          onPress={() => setActiveFilter(f)}
          style={{
            paddingHorizontal: hs(16),
            paddingVertical: vs(8),
            borderRadius: hs(20),
            backgroundColor: activeFilter === f ? theme.primary : theme.surfaceContainerLow,
          }}
        >
          <Text style={{ fontSize: fontScale(13), fontWeight: "700", color: activeFilter === f ? "white" : theme.onSurfaceVariant, textTransform: "capitalize" }}>
            {t(f)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function EmptyState({ theme, hs, vs, fontScale, t }) {
  return (
    <View style={{ padding: hs(24), borderRadius: hs(16), backgroundColor: theme.surfaceContainerLow, alignItems: "center", marginTop: vs(20) }}>
      <MaterialCommunityIcons name="calendar-blank-outline" size={hs(48)} color={theme.outlineVariant} />
      <Text style={{ fontSize: fontScale(16), fontWeight: "600", color: theme.onSurfaceVariant, marginTop: vs(12) }}>
        {t("noSchedules")}
      </Text>
    </View>
  );
}

function Footer({ hasMore, loadingMore, loadMore, theme, hs, vs, fontScale, t }) {
  if (!hasMore) return null;
  return (
    <TouchableOpacity
      onPress={loadMore}
      disabled={loadingMore}
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
  );
}

export default function RepScheduleList() {
  const { t } = useLanguage();
  const { theme, isDark } = useAppTheme();
  const { hs, vs, fontScale } = useResponsive();
  const router = useRouter();
  const { filter } = useLocalSearchParams();
  const { schedules, loading, loadingMore, hasMore, error, loadMore, refresh } = useRepSchedules();
  const [activeFilter, setActiveFilter] = useState(FILTERS.includes(filter) ? filter : "all");

  useEffect(() => {
    if (filter && FILTERS.includes(filter)) {
      setActiveFilter(filter);
    }
  }, [filter]);

  const filteredSchedules = useMemo(
    () => activeFilter === "all" ? schedules : schedules.filter((s) => s.status === activeFilter),
    [schedules, activeFilter],
  );

  const handleSchedulePress = useCallback(
    (id) => router.push({ pathname: "/(rep)/RepScheduleDetail", params: { id } }),
    [router],
  );

  const renderItem = useCallback(
    ({ item }) => (
      <RepScheduleCard
        schedule={item}
        onPress={() => handleSchedulePress(item.id)}
      />
    ),
    [handleSchedulePress],
  );

  return (
    <View style={[tw`flex-1`, { backgroundColor: theme.surface }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[{ flexDirection: "row", alignItems: "center", paddingHorizontal: hs(24), height: vs(64), borderBottomWidth: 1, borderBottomColor: theme.outlineVariant }]}>
          <Text style={[{ fontSize: fontScale(24), fontWeight: "800", letterSpacing: -0.5 }, { color: theme.onSurface }]}>
            {t("schedules")}
          </Text>
        </View>

        <FlatList
          data={filteredSchedules}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: hs(24), paddingBottom: vs(192) }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={theme.primary} />}
          ListHeaderComponent={<FilterBar activeFilter={activeFilter} setActiveFilter={setActiveFilter} theme={theme} hs={hs} vs={vs} fontScale={fontScale} t={t} />}
          ListFooterComponent={<Footer hasMore={hasMore} loadingMore={loadingMore} loadMore={loadMore} theme={theme} hs={hs} vs={vs} fontScale={fontScale} t={t} />}
          ListEmptyComponent={loading ? null : error ? <ErrorState message={t("couldNotLoad")} onRetry={refresh} /> : <EmptyState theme={theme} hs={hs} vs={vs} fontScale={fontScale} t={t} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
        />
      </SafeAreaView>

      <View style={tw`absolute bottom-0 left-0 right-0 z-50`}>
        <RepBottomNavBar activeTab="Schedules" />
      </View>
    </View>
  );
}
