import { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking, Platform, Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import tw from "twrnc";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useResponsive } from "@/constants/responsive";
import { placeOrder } from "@/services/orderService";

export default function PharmacyDetails() {
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const { hs, vs, fontScale } = useResponsive();
  const { pharmacy, medications } = useLocalSearchParams();
  const [placing, setPlacing] = useState(false);

  const pharmacyData = pharmacy ? JSON.parse(pharmacy) : null;
  const medicationsData = medications ? JSON.parse(medications) : [];

  const openExternalMap = () => {
    if (!pharmacyData) return;
    const latLng = `${pharmacyData.lat},${pharmacyData.lng}`;
    const url = Platform.select({
      ios: `maps:0,0?q=${pharmacyData.name}@${latLng}`,
      android: `geo:0,0?q=${latLng}(${pharmacyData.name})`,
    });
    Linking.openURL(url);
  };

  const handlePlaceOrder = async () => {
    if (!pharmacyData || medicationsData.length === 0) return;
    if (placing) return;
    setPlacing(true);
    try {
      const items = medicationsData.map((m) => ({
        medication_id: m.medication_id || m.id,
        quantity: 1,
      }));
      console.log("[PharmacyDetails] placeOrder:", { pharmacyId: pharmacyData.id, items });
      await placeOrder(pharmacyData.id, items);

      Alert.alert(
        t("orderPlaced"),
        "Your request has been sent; please wait for a response from the pharmacy.",
      );
    } catch {
      Alert.alert(t("error"), t("orderFailed"));
      setPlacing(false);
    }
  };

  if (!pharmacyData) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-[${theme.surface}]`}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-[${theme.surface}]`}>
      <ScrollView contentContainerStyle={{ padding: hs(24), paddingBottom: vs(128) }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: hs(10), marginBottom: vs(20) }}>
          <View style={{ width: hs(6), height: vs(28), borderRadius: hs(3), backgroundColor: theme.primary }} />
          <Text style={[{ fontSize: fontScale(26), fontWeight: "800" }, { color: theme.onSurface }]}>{t("pharmacyDetails")}</Text>
        </View>

        <View style={[{ backgroundColor: theme.surfaceContainerLowest, borderRadius: hs(24), marginBottom: vs(24), shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, overflow: "hidden" }]}>
          <View style={{ height: vs(4), backgroundColor: theme.primary }} />
          <View style={{ padding: hs(20) }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: vs(8) }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: hs(10), flex: 1 }}>
                <View style={{ width: hs(44), height: hs(44), borderRadius: hs(14), backgroundColor: theme.primaryContainer, alignItems: "center", justifyContent: "center" }}>
                  <MaterialCommunityIcons name="store" size={hs(24)} color={theme.primary} />
                </View>
                <Text style={[{ fontSize: fontScale(18), fontWeight: "700", flex: 1 }, { color: theme.onSurface }]}>{pharmacyData.name}</Text>
              </View>
              {pharmacyData.is_open !== false && (
                <View style={{ backgroundColor: theme.primaryContainer, paddingHorizontal: hs(10), paddingVertical: vs(3), borderRadius: hs(12) }}>
                  <Text style={{ fontSize: fontScale(10), fontWeight: "700", color: theme.primary, textTransform: "uppercase" }}>{t("open")}</Text>
                </View>
              )}
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: hs(6), marginBottom: vs(4) }}>
              <MaterialCommunityIcons name="map-marker" size={hs(16)} color={theme.onSurfaceVariant} />
              <Text style={[{ fontSize: fontScale(13), flex: 1 }, { color: theme.onSurfaceVariant }]}>{pharmacyData.address}</Text>
            </View>

            {pharmacyData.distance_km != null && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: hs(6), marginBottom: vs(12) }}>
                <MaterialCommunityIcons name="map-marker-distance" size={hs(16)} color={theme.onSurfaceVariant} />
                <Text style={[{ fontSize: fontScale(12) }, { color: theme.onSurfaceVariant }]}>
                  {pharmacyData.distance_km.toFixed(1)} km {t("away")}
                </Text>
              </View>
            )}

            <TouchableOpacity onPress={openExternalMap} activeOpacity={0.8}>
              <Image
                source={{
                  uri: `https://maps.googleapis.com/maps/api/staticmap?center=${pharmacyData.lat},${pharmacyData.lng}&zoom=15&size=600x300&markers=color:red%7C${pharmacyData.lat},${pharmacyData.lng}`,
                }}
                style={{ width: "100%", height: vs(160), borderRadius: hs(16), marginTop: vs(4) }}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={openExternalMap}
              style={{ marginTop: vs(10), flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: theme.surfaceContainerLow, paddingVertical: vs(10), borderRadius: hs(14) }}
            >
              <MaterialCommunityIcons name="navigation" size={hs(20)} color={theme.primary} />
              <Text style={{ marginLeft: hs(6), fontSize: fontScale(14), fontWeight: "700", color: theme.primary }}>{t("openInMaps")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {medicationsData.length > 0 && (
          <View style={[{ backgroundColor: theme.surfaceContainerLowest, padding: hs(20), borderRadius: hs(24), marginBottom: vs(24), shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: hs(8), marginBottom: vs(16) }}>
              <MaterialCommunityIcons name="pill" size={hs(22)} color={theme.primary} />
              <Text style={[{ fontSize: fontScale(20), fontWeight: "700" }, { color: theme.onSurface }]}>{t("medications")}</Text>
            </View>

            {medicationsData.map((item, index) => (
              <View key={item.medication_id || item.id} style={[{ padding: hs(14), borderRadius: hs(14), marginBottom: index < medicationsData.length - 1 ? vs(10) : 0, borderWidth: 1, borderColor: theme.surfaceContainerLow, overflow: "hidden" }]}>
                <View style={{ width: hs(4), height: "100%", position: "absolute", left: 0, top: 0, backgroundColor: theme.primary, borderTopLeftRadius: hs(14), borderBottomLeftRadius: hs(14) }} />
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginLeft: hs(4) }}>
                  <Text style={[{ fontSize: fontScale(16), fontWeight: "700" }, { color: theme.onSurface }]}>
                    {item.trade_name}
                  </Text>
                  {item.price && (
                    <Text style={[{ fontSize: fontScale(16), fontWeight: "700" }, { color: theme.primary }]}>
                      {item.price} {t("currency")}
                    </Text>
                  )}
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: hs(10), marginTop: vs(6), marginLeft: hs(4) }}>
                  {item.stock != null && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: hs(4) }}>
                      <MaterialCommunityIcons name="package-variant" size={hs(14)} color={theme.onSurfaceVariant} />
                      <Text style={[{ fontSize: fontScale(12) }, { color: theme.onSurfaceVariant }]}>
                        {t("stock")}: {item.stock}
                      </Text>
                    </View>
                  )}
                  {item.match_type && (
                    <View style={[{ paddingHorizontal: hs(8), paddingVertical: 2, borderRadius: hs(10) }, { backgroundColor: theme.primaryContainer }]}>
                      <Text style={{ fontSize: fontScale(10), fontWeight: "700", textTransform: "uppercase", color: theme.primary }}>
                        {item.match_type}
                      </Text>
                    </View>
                  )}
                  {item.safety_status && item.safety_status !== "unknown" && (
                    <View style={{ backgroundColor: "#fee2e2", paddingHorizontal: hs(8), paddingVertical: 2, borderRadius: hs(10) }}>
                      <Text style={{ fontSize: fontScale(10), fontWeight: "700", textTransform: "uppercase", color: "#b91c1c" }}>
                        {item.safety_status}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          disabled={placing}
          style={{ height: vs(60), backgroundColor: theme.primary, borderRadius: hs(30), flexDirection: "row", alignItems: "center", justifyContent: "center", gap: hs(8), opacity: placing ? 0.7 : 1, shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }}
          onPress={handlePlaceOrder}
        >
          {placing ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <MaterialCommunityIcons name="clipboard-check-outline" size={hs(22)} color="white" />
              <Text style={{ fontSize: fontScale(17), fontWeight: "700", color: "white" }}>{t("placeOrder")}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
