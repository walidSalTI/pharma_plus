import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useResponsive } from "@/constants/responsive";
import { useLanguage } from "@/src/i18n/LanguageContext";

const DEFAULT_LAT = 33.5138;
const DEFAULT_LNG = 36.2765;

const MAP_HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
html,body{margin:0;padding:0;height:100%;width:100%}
#map{height:100%;width:100%}
</style>
</head>
<body>
<div id="map"></div>
<script>
var map=L.map('map',{zoomControl:true}).setView([${DEFAULT_LAT},${DEFAULT_LNG}],15);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
maxZoom:19,
attribution:'&copy; OpenStreetMap contributors'
}).addTo(map);
var marker=null;
function placeMarker(lat,lng){
if(marker){marker.setLatLng([lat,lng]);}
else{
marker=L.marker([lat,lng],{draggable:true}).addTo(map);
marker.on('dragend',function(e){
var p=e.target.getLatLng();
window.ReactNativeWebView.postMessage(JSON.stringify({lat:p.lat,lng:p.lng}));
});
}
map.setView([lat,lng],map.getZoom());
}
map.on('click',function(e){
placeMarker(e.latlng.lat,e.latlng.lng);
window.ReactNativeWebView.postMessage(JSON.stringify({lat:e.latlng.lat,lng:e.latlng.lng}));
});
window.ReactNativeWebView.postMessage(JSON.stringify({type:'ready'}));
</script>
</body>
</html>`;

export default function LocationPickerModal({ visible, onClose, onConfirm, initialLatitude, initialLongitude }) {
  const { theme } = useAppTheme();
  const { hs, vs, fontScale } = useResponsive();
  const { t } = useLanguage();
  const webViewRef = useRef(null);

  const [marker, setMarker] = useState({
    latitude: initialLatitude || DEFAULT_LAT,
    longitude: initialLongitude || DEFAULT_LNG,
  });
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (visible && mapReady && webViewRef.current) {
      if (initialLatitude && initialLongitude) {
        const lat = Number(initialLatitude);
        const lng = Number(initialLongitude);
        setMarker({ latitude: lat, longitude: lng });
        sendToWebView({ type: "setMarker", lat, lng });
      } else {
        getCurrentLocation();
      }
    }
  }, [visible, mapReady, initialLatitude, initialLongitude]);

  const sendToWebView = (data) => {
    webViewRef.current?.postMessage(JSON.stringify(data));
  };

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "ready") {
        setMapReady(true);
        return;
      }
      if (data.lat != null && data.lng != null) {
        setMarker({ latitude: data.lat, longitude: data.lng });
      }
    } catch {}
  };

  const getCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        const lat = loc.coords.latitude;
        const lng = loc.coords.longitude;
        setMarker({ latitude: lat, longitude: lng });
        sendToWebView({ type: "setMarker", lat, lng });
      }
    } catch {
    } finally {
      setLoadingLocation(false);
    }
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
            <WebView
              ref={webViewRef}
              source={{ html: MAP_HTML }}
              style={{ flex: 1 }}
              onMessage={handleWebViewMessage}
              originWhitelist={["*"]}
              javaScriptEnabled
              scrollEnabled={false}
              bounces={false}
              overScrollMode="never"
            />

            {loadingLocation && (
              <View style={{ position: "absolute", top: vs(16), alignSelf: "center", flexDirection: "row", alignItems: "center", gap: hs(8), backgroundColor: theme.surface, paddingHorizontal: hs(16), paddingVertical: vs(10), borderRadius: hs(20), elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 }}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={{ fontSize: fontScale(13), color: theme.onSurface }}>{t("detectingLocation")}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={getCurrentLocation}
              disabled={loadingLocation}
              style={{ position: "absolute", bottom: vs(100), alignSelf: "center", flexDirection: "row", alignItems: "center", gap: hs(8), backgroundColor: theme.primary, paddingHorizontal: hs(20), height: vs(48), borderRadius: hs(24), elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 }}
            >
              <MaterialCommunityIcons name="crosshairs-gps" size={hs(20)} color="white" />
              <Text numberOfLines={1} style={{ fontSize: fontScale(14), fontWeight: "700", color: "white" }}>{t("useMyLocation")}</Text>
            </TouchableOpacity>
          </View>

          <View style={{ paddingHorizontal: hs(16), paddingVertical: vs(12), borderTopWidth: 1, borderTopColor: theme.outlineVariant, backgroundColor: theme.surface }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: vs(8) }}>
              <Text style={{ fontSize: fontScale(12), color: theme.onSurfaceVariant }}>{t("latitude")}: {marker.latitude.toFixed(6)}</Text>
              <Text style={{ fontSize: fontScale(12), color: theme.onSurfaceVariant }}>{t("longitude")}: {marker.longitude.toFixed(6)}</Text>
            </View>
            <TouchableOpacity
              onPress={handleConfirm}
              style={{ height: vs(50), borderRadius: hs(12), alignItems: "center", justifyContent: "center", backgroundColor: theme.primary }}
            >
              <Text numberOfLines={1} style={{ fontSize: fontScale(16), fontWeight: "700", color: "white" }}>{t("confirmLocation")}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
