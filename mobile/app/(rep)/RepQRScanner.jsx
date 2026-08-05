import { useState, useEffect, useRef } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Animated,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { checkInVisit } from "@/services/repService";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useResponsive } from "@/constants/responsive";

export default function RepQRScanner() {
  const { scheduleId } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const { hs, vs, fontScale } = useResponsive();

  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const ringValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!permission) return;
    if (!permission.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const animateResult = (success) => {
    animatedValue.setValue(0);
    ringValue.setValue(0);
    Animated.parallel([
      Animated.spring(animatedValue, { toValue: 1, useNativeDriver: true, friction: 5, tension: 80 }),
      Animated.timing(ringValue, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  };

  const handleScan = async ({ data }) => {
    if (processing || result) return;
    if (!data) return;

    setProcessing(true);
    try {
      let parsed;
      try {
        parsed = JSON.parse(data);
      } catch {
        setResult({ success: false, message: t("invalidQR") });
        animateResult(false);
        return;
      }

      const { doctor_id, code: totpCode } = parsed;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setResult({ success: false, message: t("gpsPermissionDenied") });
        animateResult(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      await checkInVisit({
        doctor_id,
        code: totpCode,
        latitude,
        longitude,
        schedule_id: scheduleId,
      });

      setResult({ success: true, message: t("visitVerified") });
      animateResult(true);
    } catch (error) {
      const msg =
        error.message?.includes("geofence")
          ? t("outsideGeofence")
          : error.message?.includes("expired") || error.message?.includes("invalid")
            ? t("invalidQR")
            : error.message?.includes("schedule")
              ? t("noScheduleFound")
              : error.message || t("visitFailed");
      setResult({ success: false, message: msg });
      animateResult(false);
    } finally {
      setProcessing(false);
    }
  };

  if (!permission) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.surface }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.surface }}>
        <MaterialCommunityIcons name="camera-off" size={hs(48)} color={theme.onSurfaceVariant} />
        <Text style={{ fontSize: fontScale(16), color: theme.onSurfaceVariant, marginTop: vs(12), textAlign: "center", paddingHorizontal: hs(32) }}>
          {t("cameraPermissionRequired")}
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={{ marginTop: vs(16), paddingHorizontal: hs(24), paddingVertical: vs(12), borderRadius: hs(12), backgroundColor: theme.primary }}
        >
          <Text style={{ fontSize: fontScale(14), fontWeight: "700", color: "white" }}>{t("grantPermission")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const scaleAnim = animatedValue.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  const ringScale = ringValue.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.3] });
  const ringOpacity = ringValue.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.8, 0.4, 0] });

  const accentColor = result?.success ? "#059669" : "#dc2626";

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <StatusBar barStyle="light-content" />
      {!result && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={!processing && !result ? handleScan : undefined}
        />
      )}

      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: hs(24), paddingVertical: vs(12) }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: hs(40), height: hs(40), borderRadius: hs(20), justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.4)" }}
          >
            <MaterialCommunityIcons name="close" size={hs(22)} color="white" />
          </TouchableOpacity>
          <Text style={{ fontSize: fontScale(16), fontWeight: "700", color: "white" }}>
            {t("scanDoctorQR")}
          </Text>
          <View style={{ width: hs(40) }} />
        </View>

        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          {!result && !processing && (
            <>
              <View style={{ width: hs(260), height: hs(260), borderRadius: hs(24), borderWidth: 2, borderColor: "rgba(255,255,255,0.3)", borderStyle: "dashed", position: "absolute" }} />
              <View style={{ width: hs(40), height: 2, backgroundColor: theme.primary, position: "absolute", top: vs(100), left: hs(80), right: hs(80), borderRadius: 1, opacity: 0.6 }} />
              <View style={{ width: hs(40), height: 2, backgroundColor: theme.primary, position: "absolute", bottom: vs(100), left: hs(80), right: hs(80), borderRadius: 1, opacity: 0.6 }} />
              <View style={{ width: 2, height: hs(40), backgroundColor: theme.primary, position: "absolute", left: hs(100), top: hs(80), bottom: hs(80), borderRadius: 1, opacity: 0.6 }} />
              <View style={{ width: 2, height: hs(40), backgroundColor: theme.primary, position: "absolute", right: hs(100), top: hs(80), bottom: hs(80), borderRadius: 1, opacity: 0.6 }} />
            </>
          )}

          {processing && !result && (
            <View style={{ alignItems: "center", gap: vs(16) }}>
              <View style={{ width: hs(80), height: hs(80), borderRadius: hs(40), backgroundColor: "rgba(255,255,255,0.1)", justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color="white" />
              </View>
              <Text style={{ fontSize: fontScale(16), fontWeight: "600", color: "rgba(255,255,255,0.9)" }}>
                {t("verifying")}
              </Text>
            </View>
          )}
        </View>

        <View style={{ paddingHorizontal: hs(24), paddingBottom: vs(48), alignItems: "center" }}>
          <Text style={{ fontSize: fontScale(14), color: "rgba(255,255,255,0.7)", textAlign: "center" }}>
            {t("scanQRDesc")}
          </Text>
        </View>
      </SafeAreaView>

      {result && (
        <View style={{ ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.88)" }}>
          <View
            style={{
              width: hs(300),
              borderRadius: hs(28),
              backgroundColor: "rgba(255,255,255,0.08)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.12)",
              alignItems: "center",
              paddingVertical: vs(40),
              paddingHorizontal: hs(24),
            }}
          >
            <View style={{ width: hs(120), height: hs(120), justifyContent: "center", alignItems: "center", marginBottom: vs(24) }}>
              <Animated.View
                style={{
                  ...StyleSheet.absoluteFillObject,
                  width: hs(120),
                  height: hs(120),
                  borderRadius: hs(60),
                  backgroundColor: accentColor,
                  transform: [{ scale: ringScale }],
                  opacity: ringOpacity,
                }}
              />
              <Animated.View
                style={{
                  width: hs(96),
                  height: hs(96),
                  borderRadius: hs(48),
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: accentColor,
                  transform: [{ scale: scaleAnim }],
                  shadowColor: accentColor,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.5,
                  shadowRadius: 16,
                  elevation: 8,
                }}
              >
                <MaterialCommunityIcons
                  name={result.success ? "check" : "close"}
                  size={hs(48)}
                  color="white"
                />
              </Animated.View>
            </View>

            <Text style={{ fontSize: fontScale(22), fontWeight: "800", color: "white", textAlign: "center" }}>
              {result.success ? t("success") : t("failed")}
            </Text>
            <Text style={{ fontSize: fontScale(14), fontWeight: "500", color: "rgba(255,255,255,0.6)", marginTop: vs(8), textAlign: "center", lineHeight: fontScale(20) }}>
              {result.message}
            </Text>

            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.8}
              style={{
                marginTop: vs(32),
                width: "100%",
                height: vs(48),
                borderRadius: hs(14),
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: accentColor,
              }}
            >
              <Text style={{ fontSize: fontScale(15), fontWeight: "700", color: "white" }}>
                {t("done")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
