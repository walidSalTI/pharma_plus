import { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Linking, Platform, Modal
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import tw from "twrnc";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useToast } from "@/src/context/ToastContext";
import { useResponsive } from "@/constants/responsive";
import { placeOrder, getOrderStatus } from "@/services/orderService";
import InteractionSummaryCard from "@/components/InteractionSummaryCard";
import SettingsButton from "@/components/SettingsButton";

export default function PharmacyDetails() {
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const { hs, vs, fontScale } = useResponsive();
  const { error: toastError, warning: toastWarning } = useToast();
  const { pharmacy, medications, interactions } = useLocalSearchParams();
  
  const [placing, setPlacing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [orderStatus, setOrderStatus] = useState(null);
  const pollingRef = useRef(null);

  // حالات خاصة بالتضارب الدوائي (Drug Interaction States)
  const [interactionModalVisible, setInteractionModalVisible] = useState(false);
  const [interactionWarnings, setInteractionWarnings] = useState([]);

  let pharmacyData = null;
  let medicationsData = [];
  let interactionData = null;
  try {
    if (pharmacy) pharmacyData = JSON.parse(pharmacy);
    if (medications) medicationsData = JSON.parse(medications);
    if (interactions) interactionData = JSON.parse(interactions);
  } catch {
    pharmacyData = null;
    medicationsData = [];
    interactionData = null;
  }

  const [quantities, setQuantities] = useState(() => {
    const initial = {};
    medicationsData.forEach((m) => {
      initial[m.medication_id || m.id] = 1;
    });
    return initial;
  });

  const [selectedMeds, setSelectedMeds] = useState(() => {
    const initial = {};
    medicationsData.forEach((m) => {
      initial[m.medication_id || m.id] = true;
    });
    return initial;
  });

  const selectedCount = medicationsData.filter((m) => selectedMeds[m.medication_id || m.id] !== false).length;

  const toggleMedication = (id) => {
    setSelectedMeds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const updateQuantity = (id, delta) => {
    setQuantities((prev) => {
      const current = prev[id] || 1;
      const next = current + delta;
      if (next < 1) return prev;
      return { ...prev, [id]: next };
    });
  };

  const openExternalMap = () => {
    if (!pharmacyData) return;
    const latLng = `${pharmacyData.lat},${pharmacyData.lng}`;
    const url = Platform.select({
      ios: `maps:0,0?q=${pharmacyData.name}@${latLng}`,
      android: `geo:0,0?q=${latLng}(${pharmacyData.name})`,
    });
    Linking.openURL(url);
  };

  const executeOrderPlacement = async (bypassInteraction = false) => {
    setPlacing(true);
    try {
      const selectedItems = medicationsData.filter((m) => selectedMeds[m.medication_id || m.id] !== false);
      const items = selectedItems.map((m) => ({
        medication_id: m.medication_id || m.id,
        quantity: quantities[m.medication_id || m.id] || 1,
      }));

      const result = await placeOrder(pharmacyData.id, items);

      // فحص إذا أرجع الباكيند وجود تضارب دوائي
      if (result?.has_conflict && !bypassInteraction) {
        setInteractionWarnings(result.interactions || []);
        setInteractionModalVisible(true);
        setPlacing(false);
        return;
      }

      const newOrderId = result?.id || result?.order_id;
      if (newOrderId) {
        setOrderId(newOrderId);
      }
      setPlacing(false);
      setOrderPlaced(true);
      setOrderStatus("pending");
    } catch (err) {
      // فحص إذا كان الخطأ الوارد من الـ Backend يحمل تفاصيل التضارب
      const backendInteractions =
        err?.data?.interactions ||
        err?.data?.has_conflict ||
        err?.response?.data?.interactions;
      if (backendInteractions) {
        setInteractionWarnings(Array.isArray(backendInteractions) ? backendInteractions : []);
        setInteractionModalVisible(true);
      } else {
        toastError(t("orderFailed"));
      }
      setPlacing(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!pharmacyData || medicationsData.length === 0) return;
    if (placing || orderPlaced) return;
    const selectedItems = medicationsData.filter((m) => selectedMeds[m.medication_id || m.id] !== false);
    if (selectedItems.length === 0) {
      toastWarning("Please select at least one medication");
      return;
    }
    // تحقق مسبق من التضارب الدوائي على الجهاز قبل الاتصال بالباكيند
    if (interactionData && Array.isArray(interactionData.conflicts) && interactionData.conflicts.length > 0) {
      setInteractionWarnings(interactionData.conflicts);
      setInteractionModalVisible(true);
      return;
    }
    await executeOrderPlacement(false);
  };

  const pollOrderStatus = useCallback(async () => {
    if (!orderId) return;
    try {
      const statusData = await getOrderStatus(orderId);
      const status = statusData?.status || statusData?.order_status;
      if (status) {
        setOrderStatus(status);
        if (status === "processing" || status === "confirmed" || status === "completed") {
          setPlacing(false);
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      }
    } catch {
      console.warn("[PharmacyDetails] Polling failed");
    }
  }, [orderId]);

  useEffect(() => {
    if (orderPlaced && orderId) {
      pollOrderStatus();
      pollingRef.current = setInterval(pollOrderStatus, 15000);
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [orderPlaced, orderId, pollOrderStatus]);

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
        
        {/* رأس الصفحة */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: vs(20) }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: hs(10) }}>
            <View style={{ width: hs(6), height: vs(28), borderRadius: hs(3), backgroundColor: theme.primary }} />
            <Text style={[{ fontSize: fontScale(26), fontWeight: "800" }, { color: theme.onSurface }]}>{t("pharmacyDetails")}</Text>
          </View>
          <SettingsButton />
        </View>

        {/* تفاصيل الصيدلية والخريطة */}
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
                {pharmacyData.suitability_score != null && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: hs(6), marginLeft: hs(12) }}>
                    <MaterialCommunityIcons name="star-circle-outline" size={hs(16)} color={theme.onSurfaceVariant} />
                    <Text style={[{ fontSize: fontScale(12) }, { color: theme.onSurfaceVariant }]}>
                      {t("suitability")} {pharmacyData.suitability_score}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity onPress={openExternalMap} activeOpacity={0.8}>
              <Image
                source={{
                  uri: `https://maps.googleapis.com/maps/api/staticmap?center=${pharmacyData.lat},${pharmacyData.lng}&zoom=15&size=600x300&markers=color:red%7C${pharmacyData.lat},${pharmacyData.lng}`,
                }}
                style={{ width: "100%", height: vs(160), borderRadius: hs(16), marginTop: vs(4) }}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={200}
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

        {/* ملخص فحص التفاعلات الدوائية */}
        {interactionData && (
          <InteractionSummaryCard payload={interactionData} />
        )}

        {/* قائمة الأدوية */}
        {medicationsData.length > 0 && (
          <View style={[{ backgroundColor: theme.surfaceContainerLowest, padding: hs(20), borderRadius: hs(24), marginBottom: vs(24), shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 }]}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: vs(16) }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: hs(8) }}>
                <MaterialCommunityIcons name="pill" size={hs(22)} color={theme.primary} />
                <Text style={[{ fontSize: fontScale(20), fontWeight: "700" }, { color: theme.onSurface }]}>{t("medications")}</Text>
              </View>
              {!orderPlaced && (
                <Text style={[{ fontSize: fontScale(12), fontWeight: "600" }, { color: theme.primary }]}>
                  {selectedCount} {t("selected")}
                </Text>
              )}
            </View>

            {medicationsData.map((item, index) => {
              const medId = item.medication_id || item.id;
              const isSelected = selectedMeds[medId] !== false;
              const qty = quantities[medId] || 1;
              const isAlt = item.match_type?.toLowerCase() === "alternative";
              const hasConflicts = Array.isArray(item.conflicts) && item.conflicts.length > 0;
              
              // التحقق من وجود تحذير سلامة أو تضارب لتغيير الإطار للأحمر
              const hasSafetyWarning = (item.safety_status && item.safety_status !== "unknown") || hasConflicts;

              return (
                <TouchableOpacity
                  key={medId}
                  activeOpacity={0.7}
                  onPress={() => { if (!orderPlaced) toggleMedication(medId); }}
                  style={[
                    { padding: hs(14), borderRadius: hs(14), marginBottom: index < medicationsData.length - 1 ? vs(10) : 0, borderWidth: 1, borderColor: hasSafetyWarning ? "#ef4444" : (isSelected ? theme.primary : theme.surfaceContainerLow), opacity: isSelected ? 1 : 0.5, overflow: "hidden" }, 
                    isAlt && { borderStyle: "dashed" }
                  ]}
                >
                  <View style={{ width: hs(4), height: "100%", position: "absolute", left: 0, top: 0, backgroundColor: hasSafetyWarning ? "#ef4444" : (isSelected ? theme.primary : theme.surfaceContainerLow), borderTopLeftRadius: hs(14), borderBottomLeftRadius: hs(14) }} />
                  <View style={{ flexDirection: "row", alignItems: "flex-start", marginLeft: hs(4) }}>
                    <View style={{ width: hs(22), height: hs(22), borderRadius: hs(6), borderWidth: 2, borderColor: isSelected ? theme.primary : theme.outlineVariant, backgroundColor: isSelected ? theme.primary : "transparent", alignItems: "center", justifyContent: "center", marginRight: hs(10), marginTop: vs(2) }}>
                      {isSelected && <MaterialCommunityIcons name="check" size={hs(14)} color="white" />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <Text style={[{ fontSize: fontScale(15), fontWeight: "700", flex: 1 }, { color: theme.onSurface }]}>
                          {item.trade_name}
                        </Text>
                        {item.price && (
                          <Text style={[{ fontSize: fontScale(15), fontWeight: "700" }, { color: theme.primary }]}>
                            {item.price} {t("currency")}
                          </Text>
                        )}
                      </View>
                      
                      <View style={{ flexDirection: "row", alignItems: "center", gap: hs(8), marginTop: vs(4), flexWrap: "wrap" }}>
                        {item.stock != null && (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: hs(3) }}>
                            <MaterialCommunityIcons name="package-variant" size={hs(12)} color={theme.onSurfaceVariant} />
                            <Text style={[{ fontSize: fontScale(11) }, { color: theme.onSurfaceVariant }]}>
                              {t("stock")}: {item.stock}
                            </Text>
                          </View>
                        )}
                        {item.match_type && (
                          <View style={[{ paddingHorizontal: hs(8), paddingVertical: 2, borderRadius: hs(8) }, { backgroundColor: isAlt ? "#fef3c7" : theme.primaryContainer }]}>
                            <Text style={{ fontSize: fontScale(9), fontWeight: "700", textTransform: "uppercase", color: isAlt ? "#d97706" : theme.primary }}>
                              {item.match_type}
                            </Text>
                          </View>
                        )}
                        
                        {/* تحذير السلامة والتضارب */}
                        {hasSafetyWarning && (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#fee2e2", paddingHorizontal: hs(8), paddingVertical: 2, borderRadius: hs(8) }}>
                            <MaterialCommunityIcons name="alert-circle" size={hs(12)} color="#b91c1c" />
                            <Text style={{ fontSize: fontScale(9), fontWeight: "700", textTransform: "uppercase", color: "#b91c1c" }}>
                              {item.safety_status && item.safety_status !== "unknown"
                                ? item.safety_status
                                : `${item.conflicts.length} ${t("conflictsDetected")}`}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* تفاصيل التضارب الدوائي / المرضي لكل دواء */}
                      {hasConflicts && item.conflicts.map((conflict, cIdx) => {
                        const high = Number(conflict.risk_level) >= 2;
                        const isDrug = conflict.type === "drug";
                        const label = isDrug ? `${conflict.drug1} \u00d7 ${conflict.drug2}` : (conflict.disease || t("warning"));
                        return (
                          <View
                            key={cIdx}
                            style={{ backgroundColor: high ? "#fef2f2" : "#fffbeb", borderRadius: hs(10), padding: hs(10), marginTop: vs(8), borderLeftWidth: 3, borderLeftColor: high ? "#dc2626" : "#d97706" }}
                          >
                            <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: hs(6) }}>
                              <MaterialCommunityIcons name="alert-octagon" size={hs(14)} color={high ? "#dc2626" : "#d97706"} />
                              <Text style={{ fontSize: fontScale(12), fontWeight: "700", flexShrink: 1, color: theme.onSurface }}>
                                {label}
                              </Text>
                              <View style={{ paddingHorizontal: hs(6), paddingVertical: vs(1), borderRadius: hs(8), backgroundColor: high ? "#fee2e2" : "#fef3c7" }}>
                                <Text style={{ fontSize: fontScale(9), fontWeight: "700", color: high ? "#dc2626" : "#d97706" }}>
                                  {high ? t("highRisk") : t("caution")}
                                </Text>
                              </View>
                              {conflict.verified_by_ai ? (
                                <View style={{ flexDirection: "row", alignItems: "center", gap: hs(3), paddingHorizontal: hs(6), paddingVertical: vs(2), borderRadius: hs(8), backgroundColor: "#e0f2fe" }}>
                                  <MaterialCommunityIcons name="robot-outline" size={hs(10)} color="#0284c7" />
                                  <Text style={{ fontSize: fontScale(9), fontWeight: "700", color: "#0284c7" }}>{t("aiVerified")}</Text>
                                </View>
                              ) : null}
                            </View>
                            {conflict.reason ? (
                              <Text style={{ fontSize: fontScale(11), lineHeight: fontScale(15), marginTop: vs(4), color: theme.onSurfaceVariant }}>
                                {conflict.reason}
                              </Text>
                            ) : null}
                          </View>
                        );
                      })}

                      {isSelected && (
                        <View style={{ flexDirection: "row", alignItems: "center", marginTop: vs(10), borderTopWidth: 1, borderTopColor: theme.surfaceContainerLow, paddingTop: vs(8) }}>
                          <Text style={[{ fontSize: fontScale(13), fontWeight: "600", marginRight: hs(10) }, { color: theme.onSurfaceVariant }]}>
                            {t("qty")}:
                          </Text>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: hs(6) }}>
                            <TouchableOpacity
                              disabled={orderPlaced}
                              onPress={() => updateQuantity(medId, -1)}
                              style={{ width: hs(30), height: hs(30), borderRadius: hs(15), backgroundColor: orderPlaced ? theme.surfaceContainerLow : theme.primaryContainer, alignItems: "center", justifyContent: "center" }}
                            >
                              <MaterialCommunityIcons name="minus" size={hs(16)} color={orderPlaced ? theme.onSurfaceVariant : theme.primary} />
                            </TouchableOpacity>
                            <Text style={[{ fontSize: fontScale(16), fontWeight: "700", minWidth: hs(24), textAlign: "center" }, { color: theme.onSurface }]}>
                              {qty}
                            </Text>
                            <TouchableOpacity
                              disabled={orderPlaced}
                              onPress={() => updateQuantity(medId, 1)}
                              style={{ width: hs(30), height: hs(30), borderRadius: hs(15), backgroundColor: orderPlaced ? theme.surfaceContainerLow : theme.primaryContainer, alignItems: "center", justifyContent: "center" }}
                            >
                              <MaterialCommunityIcons name="plus" size={hs(16)} color={orderPlaced ? theme.onSurfaceVariant : theme.primary} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* زر إتمام الطلب */}
        <TouchableOpacity
          disabled={placing || orderPlaced}
          style={{ height: vs(60), borderRadius: hs(30), flexDirection: "row", alignItems: "center", justifyContent: "center", gap: hs(8), opacity: (placing || orderPlaced) ? 0.7 : 1, backgroundColor: orderPlaced ? (orderStatus === "processing" || orderStatus === "confirmed" ? "#16a34a" : theme.primary) : theme.primary, shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }}
          onPress={handlePlaceOrder}
        >
          {placing ? (
            <ActivityIndicator color="white" />
          ) : orderPlaced ? (
            <>
              <MaterialCommunityIcons name="check-circle-outline" size={hs(22)} color="white" />
              <Text style={{ fontSize: fontScale(15), fontWeight: "700", color: "white" }}>
                {orderStatus === "processing" || orderStatus === "confirmed"
                  ? t("pharmacistProcessing")
                  : t("requestSent")}
              </Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons name="clipboard-check-outline" size={hs(22)} color="white" />
              <Text style={{ fontSize: fontScale(17), fontWeight: "700", color: "white" }}>{t("placeOrder")} ({selectedCount})</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* مودال التحذير من التضارب الدوائي (Drug Interaction Modal) */}
      <Modal
        visible={interactionModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: hs(20) }}>
          <View style={{ backgroundColor: theme.surfaceContainerLowest, width: "100%", borderRadius: hs(20), padding: hs(20), shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, elevation: 5 }}>
            
            <View style={{ flexDirection: "row", alignItems: "center", gap: hs(10), marginBottom: vs(12) }}>
              <MaterialCommunityIcons name="alert-octagon" size={hs(28)} color="#dc2626" />
              <Text style={{ fontSize: fontScale(18), fontWeight: "700", color: "#dc2626" }}>
                {t("drugInteractionWarning") || "تحذير تضارب دوائي"}
              </Text>
            </View>

            <Text style={{ fontSize: fontScale(14), color: theme.onSurfaceVariant, marginBottom: vs(16) }}>
              {t("interactionMessage") || "تم اكتشاف تعارض بين الأدوية التي تريد طلبها وأدوية أخرى في سجلك الطبي:"}
            </Text>

            <ScrollView style={{ maxHeight: vs(200), marginBottom: vs(16) }}>
              {interactionWarnings.map((warning, idx) => {
                const high = Number(warning.risk_level) >= 2;
                const label =
                  (warning.medication_a && warning.medication_b)
                    ? `${warning.medication_a} + ${warning.medication_b}`
                    : (warning.drug1 && warning.drug2)
                      ? `${warning.drug1} \u00d7 ${warning.drug2}`
                      : (warning.disease || t("warning"));
                const description = warning.description || warning.reason || "";
                return (
                  <View key={idx} style={{ backgroundColor: high ? "#fee2e2" : "#fffbeb", padding: hs(10), borderRadius: hs(10), marginBottom: vs(8), borderLeftWidth: 3, borderLeftColor: high ? "#dc2626" : "#d97706" }}>
                    <Text style={{ fontSize: fontScale(13), fontWeight: "700", color: high ? "#991b1b" : "#92400e" }}>
                      {label}
                    </Text>
                    {description ? (
                      <Text style={{ fontSize: fontScale(12), color: "#7f1d1d", marginTop: vs(2) }}>
                        {description}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </ScrollView>

            <View style={{ flexDirection: "row", gap: hs(10) }}>
              {/* زر الإلغاء والرجوع */}
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: vs(12), borderRadius: hs(14), backgroundColor: theme.surfaceContainerLow, alignItems: "center" }}
                onPress={() => setInteractionModalVisible(false)}
              >
                <Text style={{ fontSize: fontScale(14), fontWeight: "700", color: theme.onSurface }}>
                  {t("cancel") || "إلغاء الطلب"}
                </Text>
              </TouchableOpacity>

              {/* زر المتابعة رغم التحذير */}
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: vs(12), borderRadius: hs(14), backgroundColor: "#dc2626", alignItems: "center" }}
                onPress={() => {
                  setInteractionModalVisible(false);
                  executeOrderPlacement(true); // تخطي التحذير والمتابعة بالطلب
                }}
              >
                <Text style={{ fontSize: fontScale(14), fontWeight: "700", color: "white" }}>
                  {t("proceedAnyway") || "متابعة رغم التحذير"}
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}