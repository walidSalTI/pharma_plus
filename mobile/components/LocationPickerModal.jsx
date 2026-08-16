import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useResponsive } from "@/constants/responsive";
import { useLanguage } from "@/src/i18n/LanguageContext";

let mapsModulePromise = null;
const loadMapsModule = () => {
  if (!mapsModulePromise) {
    mapsModulePromise = import("react-native-maps");
  }
  return mapsModulePromise;
};

const DEFAULT_REGION = {
  latitude: 33.5138,
  longitude: 36.2765,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export default function LocationPickerModal({ visible, onClose, onConfirm, initialLatitude, initialLongitude }) {
  const { theme } = useAppTheme();
  const { hs, vs, fontScale } = useResponsive();
  const { t } = useLanguage();
  const mapRef = useRef(null);

  const [region, setRegion] = useState(DEFAULT_REGION);
  const [marker, setMarker] = useState({
    latitude: initialLatitude || DEFAULT_REGION.latitude,
    longitude: initialLongitude || DEFAULT_REGION.longitude,
  });
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [maps, setMaps] = useState(null);

  useEffect(() => {
    if (visible && !maps) {
      loadMapsModule()
        .then((mod) => setMaps(mod))
        .catch((e) => console.warn("[LocationPickerModal] maps load error:", e));
    }
  }, [visible, maps]);

  useEffect(() => {
    if (visible) {
      if (initialLatitude && initialLongitude) {
        const coords = {
          latitude: Number(initialLatitude),
          longitude: Number(initialLongitude),
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(coords);
        setMarker(coords);
      } else {
        getCurrentLocation();
      }
    }
  }, [visible, initialLatitude, initialLongitude]);

  const getCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        const coords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(coords);
        setMarker(coords);
        mapRef.current?.animateToRegion(coords, 300);
      }
    } catch {
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleMapPress = (e) => {
    setMarker(e.nativeEvent.coordinate);
  };

  const handleMarkerDragEnd = (e) => {
    setMarker(e.nativeEvent.coordinate);
  };

  const handleConfirm = () => {
    onConfirm(marker.latitude, marker.longitude);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: theme.surface }}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: hs(16), paddingVertical: vs(12), borderBottomWidth: 1, borderBottomColor: theme.outlineVariant }}>
            <TouchableOpacity onPress={onClose} style={{ padding: hs(8) }}>
              <MaterialCommunityIcons name="close" size={hs(24)} color={theme.onSurface} />
            </TouchableOpacity>
            <Text style={{ fontSize: fontScale(16), fontWeight: "700", color: theme.onSurface }}>
              {t("pickLocation")}
            </Text>
            <View style={{ width: hs(40) }} />
          </View>

          <View style={{ flex: 1 }}>
            {maps ? (
              <maps.default
                ref={mapRef}
                style={{ flex: 1 }}
                region={region}
                onRegionChangeComplete={setRegion}
                onPress={handleMapPress}
              >
                <maps.Marker
                  coordinate={marker}
                  draggable
                  onDragEnd={handleMarkerDragEnd}
                  pinColor={theme.primary}
                />
              </maps.default>
            ) : (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <ActivityIndicator size="large" color={theme.primary} />
              </View>
            )}

            {loadingLocation && (
              <View style={{ position: "absolute", top: vs(16), alignSelf: "center", flexDirection: "row", alignItems: "center", gap: hs(8), backgroundColor: theme.surface, paddingHorizontal: hs(16), paddingVertical: vs(10), borderRadius: hs(20), elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 }}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={{ fontSize: fontScale(13), color: theme.onSurface }}>{t("detectingLocation")}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={getCurrentLocation}
              disabled={loadingLocation}
              style={{ position: "absolute", bottom: vs(100), alignSelf: "center", flexDirection: "row", alignItems: "center", gap: hs(8), backgroundColor: theme.primary, paddingHorizontal: hs(20), paddingVertical: vs(12), borderRadius: hs(24), elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 }}
            >
              <MaterialCommunityIcons name="crosshairs-gps" size={hs(20)} color="white" />
              <Text style={{ fontSize: fontScale(14), fontWeight: "700", color: "white" }}>{t("useMyLocation")}</Text>
            </TouchableOpacity>
          </View>

          <View style={{ paddingHorizontal: hs(16), paddingVertical: vs(12), borderTopWidth: 1, borderTopColor: theme.outlineVariant, backgroundColor: theme.surface }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: vs(8) }}>
              <Text style={{ fontSize: fontScale(12), color: theme.onSurfaceVariant }}>{t("latitude")}: {marker.latitude.toFixed(6)}</Text>
              <Text style={{ fontSize: fontScale(12), color: theme.onSurfaceVariant }}>{t("longitude")}: {marker.longitude.toFixed(6)}</Text>
            </View>
            <TouchableOpacity
              onPress={handleConfirm}
              style={{ paddingVertical: vs(14), borderRadius: hs(12), alignItems: "center", backgroundColor: theme.primary }}
            >
              <Text style={{ fontSize: fontScale(16), fontWeight: "700", color: "white" }}>{t("confirmLocation")}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
