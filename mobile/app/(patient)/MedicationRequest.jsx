import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { useResponsive } from "@/constants/responsive";

export default function MedicationRequest() {
  const router = useRouter();
  const { t } = useLanguage();
  const { theme, isDark } = useAppTheme();
  const { hs, vs, fontScale, isTablet, isLandscape } = useResponsive();

  const [search, setSearch] = useState("");
  const [medications, setMedications] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [basket, setBasket] = useState([]);
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [pharmacyResults, setPharmacyResults] = useState([]);
  const [searchingPharmacy, setSearchingPharmacy] = useState(false);
  const handleSearch = async () => {
    if (!search.trim()) {
      setMedications([]);
      return;
    }

    setSearchLoading(true);
    try {
      const data = await searchMedications(search.trim());
      console.log("[Search Response]:", JSON.stringify(data, null, 2));
      setMedications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("[Search Error]:", err);
      setMedications([]);
    }
    setSearchLoading(false);
  };

  const getLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("error"), t("gpsPermissionDenied"));
        setLocationLoading(false);
        return null;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      setLocationLoading(false);
      return loc.coords;
    } catch {
      Alert.alert(t("error"), t("gpsFailed"));
      setLocationLoading(false);
      return null;
    }
  };

  const handleFindPharmacies = async () => {
    if (basket.length === 0) {
      return Alert.alert(t("error"), t("selectOneMed"));
    }

    const coords = location || await getLocation();
    if (!coords) return;

    setSearchingPharmacy(true);
    try {
      const queries = basket.map((m) => m.trade_name);
      console.log("[Pharmacy Search] Sending:", JSON.stringify({ queries, latitude: String(coords.latitude), longitude: String(coords.longitude) }));
      const results = await searchPharmaciesByMedications(
        queries,
        String(coords.latitude),
        String(coords.longitude),
      );
      console.log("[Pharmacy Search Response]:", JSON.stringify(results, null, 2));
      setPharmacyResults(Array.isArray(results) ? results : []);
    } catch (err) {
      console.log("[Pharmacy Search Error]:", err);
      Alert.alert(t("error"), t("failedConnection"));
    } finally {
      setSearchingPharmacy(false);
    }
  };

  const addToBasket = (item) => {
    if (!basket.find((m) => m.id === item.id)) {
      setBasket([...basket, item]);
    } else {
      Alert.alert(t("alert"), t("alreadyAdded"));
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
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: hs(24), paddingVertical: vs(16), backgroundColor: theme.surfaceContainerLowest, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: hs(12) }}>
            <Image
              source={{ uri: "https://avatar.iran.liara.run/public/woman" }}
              style={{ width: hs(40), height: hs(40), borderRadius: hs(20), backgroundColor: theme.surfaceContainerLow }}
            />
            <Text style={[{ fontSize: fontScale(20), fontWeight: "700" }, { color: theme.primary }]}>
              {t("vitalisHealth")}
            </Text>
          </View>
          <MaterialCommunityIcons
            name="bell-outline"
            size={hs(24)}
            color={theme.primary}
          />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: hs(24), paddingTop: vs(24), paddingBottom: vs(160) }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ marginBottom: vs(32) }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: hs(10), marginBottom: vs(4) }}>
              <View style={{ width: hs(6), height: vs(28), borderRadius: hs(3), backgroundColor: theme.primary }} />
              <Text style={[{ fontSize: fontScale(28), fontWeight: "800" }, { color: theme.onSurface }]}>
                {t("findYourMed")}
              </Text>
            </View>
            <Text style={[{ fontSize: fontScale(14), marginBottom: vs(20), marginLeft: hs(0) }, { color: theme.onSurfaceVariant }]}>
              {t("searchDesc") || "Search for medications and find nearby pharmacies"}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: theme.surfaceContainerLowest, borderRadius: hs(24), paddingHorizontal: hs(16), height: vs(64), borderWidth: 1, borderColor: theme.outlineVariant, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 }}>
              <MaterialCommunityIcons
                name="magnify"
                size={hs(24)}
                color={theme.onSurfaceVariant}
              />
              <TextInput
                style={{ flex: 1, marginLeft: hs(8), fontSize: fontScale(18) }}
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
              <TouchableOpacity
                onPress={handleSearch}
                disabled={searchLoading}
                style={{ backgroundColor: theme.primary, borderRadius: hs(16), paddingHorizontal: hs(16), height: vs(44), flexDirection: "row", alignItems: "center", gap: hs(6), marginLeft: hs(8) }}
              >
                {searchLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <MaterialCommunityIcons name="magnify" size={hs(20)} color="white" />
                )}
                <Text style={{ fontSize: fontScale(14), fontWeight: "700", color: "white" }}>
                  {t("search")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ marginBottom: vs(32) }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: hs(8), marginBottom: vs(16) }}>
              <View style={{ width: hs(4), height: vs(20), borderRadius: hs(2), backgroundColor: theme.primary }} />
              <Text style={[{ fontSize: fontScale(22), fontWeight: "700" }, { color: theme.onSurface }]}>
                {t("availableMeds")}
              </Text>
            </View>
            <View style={[{ backgroundColor: theme.surfaceContainerLow, borderRadius: hs(24), padding: hs(16), gap: vs(12), shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 }]}>
              {medications.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => addToBasket(item)}
                  style={{ backgroundColor: theme.surfaceContainerLowest, borderRadius: hs(16), padding: hs(14), flexDirection: "row", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3, borderWidth: 1, borderColor: theme.surfaceContainerLow, overflow: "hidden" }}
                >
                  <View style={{ width: hs(6), height: "100%", position: "absolute", left: 0, borderTopLeftRadius: hs(16), borderBottomLeftRadius: hs(16), backgroundColor: theme.primary }} />
                  <View style={{ width: hs(50), height: hs(50), borderRadius: hs(14), backgroundColor: theme.primaryContainer, alignItems: "center", justifyContent: "center", marginLeft: hs(6) }}>
                    <MaterialCommunityIcons name="pill" size={hs(26)} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: hs(14) }}>
                    <Text style={[{ fontSize: fontScale(17), fontWeight: "700" }, { color: theme.onSurface }]}>
                      {item.trade_name}
                    </Text>
                    <Text style={[{ fontSize: fontScale(13), marginTop: vs(2) }, { color: theme.onSurfaceVariant }]}>
                      {item.dosage} \u2022 {item.type}
                    </Text>
                  </View>
                  <View style={{ width: hs(34), height: hs(34), borderRadius: hs(17), backgroundColor: theme.primary, alignItems: "center", justifyContent: "center" }}>
                    <MaterialCommunityIcons name="plus" size={hs(20)} color="white" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {pharmacyResults.length > 0 && (
            <View style={{ marginBottom: vs(32) }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: hs(8), marginBottom: vs(16) }}>
                <View style={{ width: hs(4), height: vs(20), borderRadius: hs(2), backgroundColor: theme.primary }} />
                <Text style={[{ fontSize: fontScale(22), fontWeight: "700" }, { color: theme.onSurface }]}>
                  {t("nearbyPharmacies")}
                </Text>
              </View>
              <View style={[isTablet ? { flexDirection: "row", flexWrap: "wrap", gap: vs(12) } : { gap: vs(12) }]}>
                {pharmacyResults.map((ph) => (
                  <TouchableOpacity
                    key={ph.pharmacy_id}
                    activeOpacity={0.7}
                    onPress={() => selectPharmacy(ph)}
                    style={[{ backgroundColor: theme.surfaceContainerLowest, borderRadius: hs(16), padding: hs(20), shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, borderWidth: 1, borderColor: theme.surfaceContainerLow }, isTablet ? { width: isLandscape ? "31%" : "48%" } : {}]}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: vs(10) }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: hs(10), flex: 1 }}>
                        <View style={{ width: hs(40), height: hs(40), borderRadius: hs(12), backgroundColor: theme.primaryContainer, alignItems: "center", justifyContent: "center" }}>
                          <MaterialCommunityIcons name="store" size={hs(22)} color={theme.primary} />
                        </View>
                        <Text style={[{ fontSize: fontScale(17), fontWeight: "700", flex: 1 }, { color: theme.onSurface }]}>
                          {ph.pharmacy_name}
                        </Text>
                      </View>
                      {ph.is_open !== false && (
                        <View style={{ backgroundColor: theme.primaryContainer, paddingHorizontal: hs(10), paddingVertical: vs(3), borderRadius: hs(12) }}>
                          <Text style={{ fontSize: fontScale(10), fontWeight: "700", color: theme.primary, textTransform: "uppercase" }}>
                            {t("open")}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={[{ fontSize: fontScale(13), marginBottom: vs(10) }, { color: theme.onSurfaceVariant }]}>
                      {ph.pharmacy_address}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: hs(20), marginBottom: vs(12), paddingVertical: vs(8), borderTopWidth: 1, borderTopColor: theme.surfaceContainerLow, borderBottomWidth: 1, borderBottomColor: theme.surfaceContainerLow }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: hs(6) }}>
                        <View style={{ width: hs(28), height: hs(28), borderRadius: hs(14), backgroundColor: theme.surfaceContainerLow, alignItems: "center", justifyContent: "center" }}>
                          <MaterialCommunityIcons name="map-marker-distance" size={hs(14)} color={theme.primary} />
                        </View>
                        <View>
                          <Text style={[{ fontSize: fontScale(10) }, { color: theme.onSurfaceVariant }]}>{t("distance")}</Text>
                          <Text style={[{ fontSize: fontScale(13), fontWeight: "700" }, { color: theme.onSurface }]}>
                            {ph.distance_km?.toFixed(1) || "?"} km
                          </Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: hs(6) }}>
                        <View style={{ width: hs(28), height: hs(28), borderRadius: hs(14), backgroundColor: theme.surfaceContainerLow, alignItems: "center", justifyContent: "center" }}>
                          <MaterialCommunityIcons name="star" size={hs(14)} color="#f59e0b" />
                        </View>
                        <View>
                          <Text style={[{ fontSize: fontScale(10) }, { color: theme.onSurfaceVariant }]}>{t("rating")}</Text>
                          <Text style={[{ fontSize: fontScale(13), fontWeight: "700" }, { color: theme.onSurface }]}>
                            {ph.suitability_score?.toFixed(0) || "?"}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: hs(8) }}>
                      {(ph.medications || []).map((med) => (
                        <View key={med.medication_id} style={{ backgroundColor: theme.surfaceContainerLow, paddingHorizontal: hs(12), paddingVertical: vs(6), borderRadius: hs(16), flexDirection: "row", alignItems: "center", gap: hs(4), borderWidth: 1, borderColor: theme.primaryContainer }}>
                          <Text style={[{ fontSize: fontScale(12), fontWeight: "700" }, { color: theme.onSurface }]}>
                            {med.trade_name}
                          </Text>
                          <Text style={[{ fontSize: fontScale(12), fontWeight: "700" }, { color: theme.primary }]}>
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
          <View style={{ backgroundColor: theme.surfaceContainerLowest, borderTopWidth: 1, borderTopColor: theme.outlineVariant, paddingHorizontal: hs(24), paddingVertical: vs(12), shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: vs(10) }}>
              <Text style={[{ fontSize: fontScale(16), fontWeight: "700", marginRight: hs(12) }, { color: theme.onSurface }]}>
                {t("myBasket")} ({basket.length})
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                {basket.map((item) => (
                  <View key={item.id} style={{ backgroundColor: theme.primaryContainer, marginRight: hs(8), paddingHorizontal: hs(14), paddingVertical: vs(6), borderRadius: hs(20), flexDirection: "row", alignItems: "center" }}>
                    <Text style={[{ fontSize: fontScale(13), fontWeight: "700" }, { color: theme.primary, marginRight: hs(6) }]}>
                      {item.trade_name}
                    </Text>
                    <TouchableOpacity onPress={() => setBasket(basket.filter((b) => b.id !== item.id))}>
                      <MaterialCommunityIcons name="close-circle" size={hs(16)} color={theme.primary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
            <TouchableOpacity
              style={{ height: vs(52), backgroundColor: theme.primary, borderRadius: hs(26), flexDirection: "row", alignItems: "center", justifyContent: "center", gap: hs(8) }}
              onPress={handleFindPharmacies}
              disabled={searchingPharmacy}
            >
              {searchingPharmacy || locationLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <MaterialCommunityIcons name="store-marker-outline" size={hs(20)} color="white" />
                  <Text style={{ fontSize: fontScale(16), fontWeight: "700", color: "white" }}>
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
