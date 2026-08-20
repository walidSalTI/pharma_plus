import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import tw from "twrnc";
import { getMedicationsPage } from "@/services/medService";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { webShadow } from "@/constants/shadow";
import { useResponsive } from "@/constants/responsive";
import { useInteractionCheck } from "@/hooks/useInteractionCheck";
import InteractionAlertModal from "@/components/InteractionAlertModal";
import ErrorState from "@/components/ErrorState";
import SettingsButton from "@/components/SettingsButton";

export default function BrowseMedications() {
  const router = useRouter();
  const { t } = useLanguage();
  const { theme, isDark } = useAppTheme();
  const { hs, vs, fontScale } = useResponsive();
  const mountedRef = useRef(true);

  const [search, setSearch] = useState("");
  const [medications, setMedications] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [selectedMeds, setSelectedMeds] = useState([]);
  const {
    checkAndConfirm,
    checking,
    payload: interactionPayload,
    visible: interactionVisible,
    onProceed,
    onCancel,
  } = useInteractionCheck();

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchPage = useCallback(async (pageNum, query, append = false) => {
    if (pageNum === 1) { setLoading(true); setError(false); }
    else setLoadingMore(true);
    try {
      const params = { page: pageNum };
      if (query) {
        params.name = query;
      }
      const { data, meta } = await getMedicationsPage(params);
      if (!mountedRef.current) return;
      if (append) {
        setMedications((prev) => [...prev, ...data]);
      } else {
        setMedications(data);
      }
      if (meta) {
        setPage(meta.current_page || pageNum);
        setLastPage(meta.last_page || 1);
      }
    } catch {
      if (mountedRef.current) {
        setError(true);
        if (!append) setMedications([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchPage(1, "", false);
  }, [fetchPage]);

  const handleSearch = () => {
    fetchPage(1, search, false);
  };

  const clearSearch = () => {
    setSearch("");
    fetchPage(1, "", false);
  };

  const loadMore = () => {
    if (loadingMore || page >= lastPage) return;
    fetchPage(page + 1, search, true);
  };

  const toggle = useCallback((med) => {
    setSelectedMeds((prev) => {
      const exists = prev.some((m) => m.id === med.id);
      return exists ? prev.filter((m) => m.id !== med.id) : [...prev, med];
    });
  }, []);

  // Run the drug-interaction / chronic-disease safety check before allowing the
  // patient to proceed to the dosage setup page. Rank 0 proceeds silently;
  // Rank 1/2 opens a warning modal. If the check itself cannot run (offline /
  // backend unavailable) we fail closed: an explicit warning is shown and the
  // patient may only proceed at their own risk.
  const handleAddSelected = async () => {
    const names = selectedMeds.map((m) => m.trade_name).filter(Boolean);
    const result = await checkAndConfirm(names);
    if (!result) return;

    // Use the browse-selected id as the baseline and enrich it with the
    // backend-resolved medication id when the precheck provides one.
    const resolved = result.resolved || {};
    const enriched = selectedMeds.map((med) => {
      const matches = resolved[med.trade_name];
      const resolvedId = Array.isArray(matches) && matches.length > 0 ? matches[0].id : null;
      return resolvedId ? { ...med, id: resolvedId } : med;
    });

    router.push({
      pathname: "/AddMedication",
      params: { selectedMeds: JSON.stringify(enriched) },
    });
  };

  const renderItem = useCallback(({ item }) => {
    const isSelected = selectedMeds.some((m) => m.id === item.id);
    const ingredient = item.active_ingredients?.[0];
    const ratio = ingredient?.active_ratio?.[0] || "";
    
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => toggle(item)}
        style={[
          { flexDirection: "row", alignItems: "center", gap: hs(16), padding: hs(16), marginBottom: vs(10), borderRadius: hs(16) },
          { backgroundColor: isDark ? theme.surfaceContainerLow : theme.surfaceContainerLowest, borderWidth: 1, borderColor: theme.outlineVariant },
          webShadow({ elevation: 2, opacity: 0.04, radius: 6, offsetY: 2 }),
        ]}
      >
        <View style={[{ width: hs(48), height: hs(48), borderRadius: hs(12), alignItems: "center", justifyContent: "center" }, { backgroundColor: theme.surfaceContainerLow }]}>
          <MaterialCommunityIcons name="pill" size={hs(24)} color={theme.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[{ fontSize: fontScale(16), fontWeight: "700" }, { color: theme.onSurface }]}>
            {item.trade_name}
          </Text>
          {item.manufacture?.name ? (
            <Text style={[{ fontSize: fontScale(11), marginTop: vs(4) }, { color: theme.onSurfaceVariant }]}>
              {item.manufacture.name}
            </Text>
          ) : null}
          {ingredient ? (
            <Text style={[{ fontSize: fontScale(10), marginTop: vs(4) }, { color: theme.outline }]}>
              {ingredient.ingredient_name_en}{ratio ? ` ${ratio}` : ""}
            </Text>
          ) : null}
        </View>
        <View style={[{ width: hs(28), height: hs(28), borderRadius: hs(14), alignItems: "center", justifyContent: "center" }, isSelected ? { backgroundColor: theme.primary } : { borderWidth: 2, borderColor: theme.outlineVariant }]}>
          {isSelected && <MaterialCommunityIcons name="check" size={hs(18)} color="white" />}
        </View>
      </TouchableOpacity>
    );
  }, [selectedMeds, theme, isDark, hs, vs, fontScale, toggle]);

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={{ paddingVertical: vs(24), alignItems: "center" }}>
        <ActivityIndicator size="small" color={theme.primary} />
        <Text style={[{ fontSize: fontScale(12), marginTop: vs(8) }, { color: theme.onSurfaceVariant }]}>
          {t("loadingMore")}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[tw`flex-1 items-center justify-center`, { backgroundColor: theme.surface }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[{ fontSize: fontScale(14), marginTop: vs(16) }, { color: theme.onSurfaceVariant }]}>
          {t("loadingMeds")}
        </Text>
      </View>
    );
  }

  if (error && medications.length === 0) {
    return (
      <View style={[tw`flex-1 justify-center`, { backgroundColor: theme.surface }]}>
        <ErrorState message={t("couldNotLoad")} onRetry={() => fetchPage(1, search, false)} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.surface }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView style={{ flex: 1 }}>
        <View
          style={[
            tw`flex-row items-center justify-between`,
            {
              paddingHorizontal: hs(24),
              backgroundColor: isDark ? theme.surface : "rgba(255,255,255,0.9)",
              minHeight: vs(64),
              borderBottomWidth: 1,
              borderBottomColor: "rgba(0,0,0,0.04)",
            },
          ]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: hs(12) }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[{ width: hs(40), height: hs(40), borderRadius: hs(20), alignItems: "center", justifyContent: "center" }, { backgroundColor: theme.surfaceContainerLow }]}
            >
              <MaterialCommunityIcons name="arrow-left" size={hs(22)} color={theme.primary} />
            </TouchableOpacity>
            <View>
              <Text style={[{ fontSize: fontScale(10), fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 }, { color: theme.primary }]}>
                {t("medicationLabel")}
              </Text>
              <Text style={[{ fontSize: fontScale(20), fontWeight: "700" }, { color: theme.onSurface }]}>
                {t("browse")}
              </Text>
            </View>
          </View>
          <SettingsButton />
        </View>

        <View style={{ paddingHorizontal: hs(24), marginTop: vs(16), marginBottom: vs(4) }}>
          <View style={[{ flexDirection: "row", alignItems: "center", paddingHorizontal: hs(16), paddingVertical: vs(12), borderRadius: hs(16), backgroundColor: theme.surfaceContainerLowest, borderWidth: 1, borderColor: theme.outlineVariant }]}>
            <MaterialCommunityIcons name="magnify" size={hs(20)} color={theme.outline} />
            <TextInput
              style={[{ flex: 1, marginLeft: hs(12), fontSize: fontScale(16) }, { color: theme.onSurface }]}
               placeholder={t("searchByName")}
              placeholderTextColor={theme.outline}
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={{ marginRight: hs(8) }}>
                <MaterialCommunityIcons name="close-circle" size={hs(18)} color={theme.outline} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleSearch} style={[{ width: hs(36), height: hs(36), borderRadius: hs(12), alignItems: "center", justifyContent: "center" }, { backgroundColor: theme.primary }]}>
              <MaterialCommunityIcons name="magnify" size={hs(18)} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={medications}
          contentContainerStyle={{ paddingHorizontal: hs(24), paddingBottom: vs(192), paddingTop: vs(16) }}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          initialNumToRender={12}
          windowSize={7}
          maxToRenderPerBatch={10}
          removeClippedSubviews
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: vs(80) }}>
              <View style={[{ width: hs(80), height: hs(80), borderRadius: hs(40), alignItems: "center", justifyContent: "center", marginBottom: vs(20) }, { backgroundColor: theme.surfaceContainerLow }]}>
                <MaterialCommunityIcons name="pill-off" size={hs(40)} color={theme.outlineVariant} />
              </View>
              <Text style={[{ fontSize: fontScale(18), fontWeight: "700" }, { color: theme.onSurface }]}>
                {search ? t("noResultsFound") : t("noMedsAvailable")}
              </Text>
              {search ? (
                <Text style={[{ fontSize: fontScale(14), marginTop: vs(8) }, { color: theme.onSurfaceVariant }]}>
                  {t("tryDifferentName")}
                </Text>
              ) : null}
            </View>
          }
          ListHeaderComponent={
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: vs(8), paddingHorizontal: hs(4) }}>
              <Text style={[{ fontSize: fontScale(12), fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 }, { color: theme.onSurfaceVariant }]}>
                {medications.length} {medications.length === 1 ? t("medication") : t("medications")}
              </Text>
              {selectedMeds.length > 0 && (
                <View style={[{ paddingHorizontal: hs(10), paddingVertical: vs(4), borderRadius: hs(16) }, { backgroundColor: "#f0fdfa" }]}>
                  <Text style={[{ fontSize: fontScale(10), fontWeight: "700" }, { color: theme.primary }]}>
                    {selectedMeds.length} {t("selected").toLowerCase()}
                  </Text>
                </View>
              )}
            </View>
          }
        />

        {selectedMeds.length > 0 && (
          <View
            style={[
              tw`absolute bottom-0 left-0 right-0 pt-4`,
              {
                paddingHorizontal: hs(24),
                paddingBottom: vs(32),
                backgroundColor: isDark ? theme.surface : "rgba(255,255,255,0.95)",
                borderTopLeftRadius: hs(28),
                borderTopRightRadius: hs(28),
              },
              webShadow({ elevation: 16, opacity: 0.08, radius: 16, offsetY: -6 }),
            ]}
          >
            <TouchableOpacity
              onPress={handleAddSelected}
              disabled={checking}
              style={[
                { height: vs(56), borderRadius: hs(16), flexDirection: "row", alignItems: "center", justifyContent: "center", gap: hs(8), backgroundColor: theme.primary },
                webShadow({ elevation: 6, color: theme.primary, radius: 12, offsetY: 6 }),
                { opacity: checking ? 0.7 : 1 },
              ]}
            >
              {checking ? (
                <>
                  <ActivityIndicator color="white" />
                  <Text numberOfLines={1} style={{ fontSize: fontScale(16), fontWeight: "700", color: "white" }}>
                    {t("checkingSafety")}
                  </Text>
                </>
              ) : (
                <>
                  <MaterialCommunityIcons name="plus" size={hs(22)} color="white" />
                  <Text numberOfLines={1} style={{ fontSize: fontScale(16), fontWeight: "700", color: "white" }}>
                    {t("addNew")} {selectedMeds.length} {selectedMeds.length === 1 ? t("medication") : t("medications")}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <InteractionAlertModal
          payload={interactionPayload}
          visible={interactionVisible}
          onProceed={onProceed}
          onCancel={onCancel}
        />
      </SafeAreaView>
    </View>
  );
}
