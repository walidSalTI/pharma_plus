import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState, useRef } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import tw from "twrnc";
import BottomNavBar from "@/components/BottomNavBar";
import { searchMedications } from "@/services/medService";
import { searchPharmaciesByMedications } from "@/services/searchService";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useToast } from "@/src/context/ToastContext";
import { useResponsive } from "@/constants/responsive";
import { useUserName } from "@/hooks/useUserName";

export default function MedicationRequest() {
  const router = useRouter();
  const { t } = useLanguage();
  const { theme, isDark } = useAppTheme();
  const { hs, vs, fontScale, isTablet, isLandscape } = useResponsive();
  const { userName } = useUserName();
  const { error: toastError, warning: toastWarning, info: toastInfo } = useToast();
  const searchInputRef = useRef(null);

  const [search, setSearch] = useState("");
  const [medications, setMedications] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [basket, setBasket] = useState([]);
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [pharmacyResults, setPharmacyResults] = useState([]);
  const [searchingPharmacy, setSearchingPharmacy] = useState(false);
  const [hasSearchedPharmacy, setHasSearchedPharmacy] = useState(false);
  const handleSearch = async () => {
    if (!search.trim()) {
      setMedications([]);
      return;
    }

    setSearchLoading(true);
    try {
      const data = await searchMedications(search.trim());
      setMedications(Array.isArray(data) ? data : []);
    } catch {
      setMedications([]);
    }
    setSearchLoading(false);
  };

  const getLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        toastError(t("gpsPermissionDenied"));
        setLocationLoading(false);
        return null;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      setLocationLoading(false);
      return loc.coords;
    } catch {
      toastError(t("gpsFailed"));
      setLocationLoading(false);
      return null;
    }
  };

  const handleFindPharmacies = async () => {
    if (basket.length === 0) {
      return toastError(t("selectOneMed"));
    }

    const coords = location || await getLocation();
    if (!coords) return;

    setSearchingPharmacy(true);
    try {
      const queries = basket.map((m) => m.trade_name);
      const results = await searchPharmaciesByMedications(
        queries,
        String(coords.latitude),
        String(coords.longitude),
      );
      setPharmacyResults(Array.isArray(results) ? results : []);
    } catch {
      toastError(t("failedConnection"));
    } finally {
      setSearchingPharmacy(false);
      setHasSearchedPharmacy(true);
    }
  };

  const addToBasket = (item) => {
    if (!basket.find((m) => m.id === item.id)) {
      setBasket([...basket, item]);
    } else {
      toastInfo(t("alreadyAdded"));
    }
  };

  const selectPharmacy = (pharmacy) => {
    router.push({
      pathname: "/PharmacyDetails",
      params: {
        pharmacy: JSON.stringify({
          id: pharmacy.pharmacy_id,
          name: pharmacy.pharmacy_name,
          address: pharmacy.pharmacy_address,
          lat: pharmacy.pharmacy_latitude,
          lng: pharmacy.pharmacy_longitude,
          distance_km: pharmacy.distance_km,
          suitability_score: pharmacy.suitability_score,
          is_open: pharmacy.is_open,
        }),
        medications: JSON.stringify(pharmacy.medications || []),
      },
    });
  };

  return (
    <View style={tw`flex-1 bg-[${theme.surface}]`}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView style={tw`flex-1`}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: hs(24), paddingVertical: vs(14), backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.surfaceContainerLow }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: hs(10) }}>
            <View style={{ width: hs(38), height: hs(38), borderRadius: hs(19), backgroundColor: theme.primaryContainer, alignItems: "center", justifyContent: "center" }}>
              <Text style={[{ fontSize: fontScale(16), fontWeight: "700" }, { color: theme.primary }]}>
                {(userName || t("vitalisHealth")).charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={[{ fontSize: fontScale(18), fontWeight: "700", letterSpacing: -0.3 }, { color: theme.onSurface }]}>
                {userName || t("vitalisHealth")}
              </Text>
              <Text style={[{ fontSize: fontScale(11) }, { color: theme.onSurfaceVariant }]}>
                {t("findYourMed")}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={{ width: hs(38), height: hs(38), borderRadius: hs(19), backgroundColor: theme.surfaceContainerLow, alignItems: "center", justifyContent: "center" }}>
            <MaterialCommunityIcons name="bell-outline" size={hs(20)} color={theme.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: hs(24), paddingTop: vs(24), paddingBottom: vs(160) }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ marginBottom: vs(28) }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: vs(4) }}>
              <Text style={[{ fontSize: fontScale(26), fontWeight: "800", letterSpacing: -0.5 }, { color: theme.onSurface }]}>
                {t("findYourMed")}
              </Text>
              {medications.length > 0 && (
                <Text style={[{ fontSize: fontScale(12), fontWeight: "600" }, { color: theme.primary }]}>
                  {medications.length} {t("results")}
                </Text>
              )}
            </View>
            <Text style={[{ fontSize: fontScale(13), marginBottom: vs(16) }, { color: theme.onSurfaceVariant }]}>
              {t("searchDesc")}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: theme.surfaceContainerLowest, borderRadius: hs(16), paddingHorizontal: hs(16), height: vs(56), borderWidth: 1, borderColor: theme.outlineVariant }}>
              <MaterialCommunityIcons
                name="magnify"
                size={hs(20)}
                color={theme.onSurfaceVariant}
              />
              <TextInput
                ref={searchInputRef}
                style={{ flex: 1, marginLeft: hs(10), fontSize: fontScale(16), color: theme.onSurface }}
                placeholder={t("searchByName")}
                placeholderTextColor={theme.onSurfaceVariant}
                value={search}
                onChangeText={(text) => {
                  setSearch(text);
                  if (!text.trim()) setMedications([]);
                }}
                returnKeyType="search"
                onSubmitEditing={handleSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => { setSearch(""); setMedications([]); }} style={{ marginRight: hs(4) }}>
                  <MaterialCommunityIcons name="close-circle" size={hs(18)} color={theme.onSurfaceVariant} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleSearch}
                disabled={searchLoading}
                style={{ backgroundColor: searchLoading ? theme.primaryContainer : theme.primary, borderRadius: hs(12), paddingHorizontal: hs(14), height: vs(38), alignItems: "center", justifyContent: "center", marginLeft: hs(6) }}
              >
                {searchLoading ? (
                  <ActivityIndicator color={theme.primary} size="small" />
                ) : (
                  <MaterialCommunityIcons name="magnify" size={hs(18)} color="white" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {medications.length > 0 && (
            <View style={{ marginBottom: vs(28) }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: hs(8), marginBottom: vs(14) }}>
                <View style={{ width: hs(4), height: vs(18), borderRadius: hs(2), backgroundColor: theme.primary }} />
                <Text style={[{ fontSize: fontScale(20), fontWeight: "700" }, { color: theme.onSurface }]}>
                  {t("availableMeds")}
                </Text>
              </View>
              <View style={{ gap: vs(10) }}>
                {medications.map((item) => {
                  const inBasket = basket.some((b) => b.id === item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => addToBasket(item)}
                      activeOpacity={0.7}
                      style={{ backgroundColor: theme.surface, borderRadius: hs(14), padding: hs(14), flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: inBasket ? theme.primary : theme.surfaceContainerLow, overflow: "hidden" }}
                    >
                      <View style={{ width: hs(44), height: hs(44), borderRadius: hs(12), backgroundColor: theme.primaryContainer, alignItems: "center", justifyContent: "center" }}>
                        <MaterialCommunityIcons name="pill" size={hs(22)} color={theme.primary} />
                      </View>
                      <View style={{ flex: 1, marginLeft: hs(12) }}>
                        <Text style={[{ fontSize: fontScale(15), fontWeight: "700" }, { color: theme.onSurface }]}>
                          {item.trade_name}
                        </Text>
                        <Text style={[{ fontSize: fontScale(12), marginTop: vs(2) }, { color: theme.onSurfaceVariant }]}>
                          {item.dosage} \u2022 {item.type}
                        </Text>
                      </View>
                      <View style={{ width: hs(32), height: hs(32), borderRadius: hs(16), backgroundColor: inBasket ? theme.primaryContainer : theme.primary, alignItems: "center", justifyContent: "center" }}>
                        <MaterialCommunityIcons
                          name={inBasket ? "check" : "plus"}
                          size={hs(18)}
                          color={inBasket ? theme.primary : "white"}
                        />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {searchingPharmacy && (
            <View style={{ marginBottom: vs(32), alignItems: "center", paddingVertical: vs(40) }}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[{ fontSize: fontScale(14), marginTop: vs(12) }, { color: theme.onSurfaceVariant }]}>
                {t("searching")}
              </Text>
            </View>
          )}

          {hasSearchedPharmacy && !searchingPharmacy && pharmacyResults.length === 0 && (
            <View style={{ marginBottom: vs(32), alignItems: "center", paddingVertical: vs(40), backgroundColor: theme.surfaceContainerLow, borderRadius: hs(20), marginHorizontal: hs(0) }}>
              <View style={{ width: hs(64), height: hs(64), borderRadius: hs(32), backgroundColor: theme.surfaceContainerLowest, alignItems: "center", justifyContent: "center", marginBottom: vs(16) }}>
                <MaterialCommunityIcons name="store-off-outline" size={hs(32)} color={theme.onSurfaceVariant} />
              </View>
              <Text style={[{ fontSize: fontScale(18), fontWeight: "700", marginBottom: vs(6) }, { color: theme.onSurface }]}>
                {t("noPharmaciesFound")}
              </Text>
              <Text style={[{ fontSize: fontScale(13), textAlign: "center", paddingHorizontal: hs(24), lineHeight: vs(20) }, { color: theme.onSurfaceVariant }]}>
                {t("noPharmaciesDesc")}
              </Text>
              <Text style={[{ fontSize: fontScale(12), marginTop: vs(12) }, { color: theme.onSurfaceVariant }]}>
                {t("noPharmaciesSuggestion")}
              </Text>
            </View>
          )}

          {pharmacyResults.length > 0 && (
            <View style={{ marginBottom: vs(32) }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: vs(14) }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: hs(8) }}>
                  <View style={{ width: hs(4), height: vs(18), borderRadius: hs(2), backgroundColor: theme.primary }} />
                  <Text style={[{ fontSize: fontScale(20), fontWeight: "700" }, { color: theme.onSurface }]}>
                    {t("nearbyPharmacies")}
                  </Text>
                </View>
                <Text style={[{ fontSize: fontScale(12), fontWeight: "600" }, { color: theme.primary }]}>
                  {pharmacyResults.length} {t("results")}
                </Text>
              </View>
              <View style={[isTablet ? { flexDirection: "row", flexWrap: "wrap", gap: hs(12) } : { gap: vs(12) }]}>
                {pharmacyResults.map((ph) => (
                  <TouchableOpacity
                    key={ph.pharmacy_id}
                    activeOpacity={0.7}
                    onPress={() => selectPharmacy(ph)}
                    style={[{ backgroundColor: theme.surface, borderRadius: hs(14), padding: hs(16), borderWidth: 1, borderColor: theme.surfaceContainerLow }, isTablet ? { width: isLandscape ? "31%" : "48%" } : {}]}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: vs(8) }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: hs(10), flex: 1 }}>
                        <View style={{ width: hs(36), height: hs(36), borderRadius: hs(10), backgroundColor: theme.primaryContainer, alignItems: "center", justifyContent: "center" }}>
                          <MaterialCommunityIcons name="store" size={hs(18)} color={theme.primary} />
                        </View>
                        <Text style={[{ fontSize: fontScale(15), fontWeight: "700", flex: 1 }, { color: theme.onSurface }]} numberOfLines={1}>
                          {ph.pharmacy_name}
                        </Text>
                      </View>
                      {ph.is_open !== false && (
                        <View style={{ backgroundColor: "#dcfce7", paddingHorizontal: hs(8), paddingVertical: vs(2), borderRadius: hs(10) }}>
                          <Text style={{ fontSize: fontScale(10), fontWeight: "700", color: "#16a34a", textTransform: "uppercase", letterSpacing: 0.5 }}>
                            {t("open")}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={[{ fontSize: fontScale(12), marginBottom: vs(10) }, { color: theme.onSurfaceVariant }]} numberOfLines={1}>
                      {ph.pharmacy_address}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: hs(16), marginBottom: vs(10), paddingVertical: vs(6), borderTopWidth: 1, borderTopColor: theme.surfaceContainerLow, borderBottomWidth: 1, borderBottomColor: theme.surfaceContainerLow }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: hs(4) }}>
                        <MaterialCommunityIcons name="map-marker-distance" size={hs(14)} color={theme.onSurfaceVariant} />
                        <Text style={[{ fontSize: fontScale(12) }, { color: theme.onSurface }]}>
                          {ph.distance_km?.toFixed(1) || "?"} km
                        </Text>
                      </View>
                     
                    </View>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: hs(6) }}>
                      {(ph.medications || []).map((med) => (
                        <View key={med.medication_id} style={{ backgroundColor: theme.primaryContainer, paddingHorizontal: hs(10), paddingVertical: vs(4), borderRadius: hs(12), flexDirection: "row", alignItems: "center", gap: hs(4) }}>
                          <Text style={[{ fontSize: fontScale(11), fontWeight: "600" }, { color: theme.onSurface }]}>
                            {med.trade_name}
                          </Text>
                          <Text style={[{ fontSize: fontScale(11), fontWeight: "700" }, { color: theme.primary }]}>
                            {med.price} {t("currency")}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

        </ScrollView>

        {basket.length > 0 && (
          <View style={{ backgroundColor: theme.surface, borderTopWidth: 1, borderTopColor: theme.surfaceContainerLow, paddingHorizontal: hs(20), paddingVertical: vs(10) }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: vs(10) }}>
              <Text style={[{ fontSize: fontScale(14), fontWeight: "700" }, { color: theme.onSurface }]}>
                {t("myBasket")}
              </Text>
              <View style={{ backgroundColor: theme.primary, borderRadius: hs(10), paddingHorizontal: hs(8), paddingVertical: vs(2), marginLeft: hs(8) }}>
                <Text style={{ fontSize: fontScale(11), fontWeight: "700", color: "white" }}>
                  {basket.length}
                </Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1, marginLeft: hs(10) }}>
                {basket.map((item) => (
                  <View key={item.id} style={{ backgroundColor: theme.primaryContainer, marginRight: hs(6), paddingHorizontal: hs(10), paddingVertical: vs(4), borderRadius: hs(14), flexDirection: "row", alignItems: "center" }}>
                    <Text style={[{ fontSize: fontScale(12), fontWeight: "600" }, { color: theme.primary, marginRight: hs(4) }]}>
                      {item.trade_name}
                    </Text>
                    <TouchableOpacity onPress={() => setBasket(basket.filter((b) => b.id !== item.id))}>
                      <MaterialCommunityIcons name="close-circle" size={hs(14)} color={theme.primary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
            <TouchableOpacity
              style={{ height: vs(48), backgroundColor: theme.primary, borderRadius: hs(14), flexDirection: "row", alignItems: "center", justifyContent: "center", gap: hs(8) }}
              onPress={handleFindPharmacies}
              disabled={searchingPharmacy || locationLoading}
            >
              {(searchingPharmacy || locationLoading) ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <MaterialCommunityIcons name="store-marker-outline" size={hs(18)} color="white" />
                  <Text style={{ fontSize: fontScale(15), fontWeight: "700", color: "white" }}>
                    {t("findPharmacies")}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
      <BottomNavBar activeTab="Health" />
    </View>
  );
}
