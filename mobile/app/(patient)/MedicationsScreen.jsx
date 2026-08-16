import { useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import tw from "twrnc";
import BottomNavBar from "@/components/BottomNavBar";
import ErrorState from "@/components/ErrorState";
import SettingsButton from "@/components/SettingsButton";
import UserAvatar from "@/components/UserAvatar";
import { useMedicationsData } from "@/hooks/useMedicationsData";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useToast } from "@/src/context/ToastContext";
import { useCustomAlert } from "@/src/context/CustomAlertContext";
import { webShadow } from "@/constants/shadow";
import { useResponsive } from "@/constants/responsive";
import { useUserName } from "@/hooks/useUserName";
import { toggleWalletItem, updatePills, deleteWalletItem } from "@/services/walletService";
import { removeMedication, getMedications } from "@/services/medicationStorage";
import { syncRemindersFromStorage } from "@/services/notificationService";

export default function MedicationsScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { theme, isDark } = useAppTheme();
  const { hs, vs, fontScale } = useResponsive();
  const { loading, meds, nextMed, otherMeds, refreshMedications, error, offline } = useMedicationsData();
  const { userName } = useUserName();
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
  const { confirm } = useCustomAlert();
  const scheduledMeds = meds.filter((m) => !m.isAsNeeded);

  const [actionMed, setActionMed] = useState(null);
  const [showPillsModal, setShowPillsModal] = useState(false);
  const [pillsInput, setPillsInput] = useState("");

  const handleToggle = async (item) => {
    setActionMed(null);
    try {
      await toggleWalletItem(item.id, !item.isActive);
      refreshMedications();
    } catch {
      toastError(t("medUpdateFailed"));
    }
  };

  const handleDelete = (item) => {
    setActionMed(null);
    confirm({
      title: t("removeFromWallet"),
      message: t("removeConfirm", { name: item.name }),
      confirmText: t("confirmRemove"),
      cancelText: t("cancel"),
      variant: "delete",
      onConfirm: async () => {
        try {
          await deleteWalletItem(item.id);
          if (item.medicationId) {
            await removeMedication(item.medicationId);
          }
          await syncRemindersFromStorage(getMedications);
          refreshMedications();
        } catch {
          toastError(t("failedRemove"));
        }
      },
    });
  };

  const handlePillsSave = async () => {
    const count = parseInt(pillsInput, 10);
    if (isNaN(count) || count < 0) return;
    setShowPillsModal(false);
    try {
      await updatePills(actionMed.id, count);
      setActionMed(null);
      setPillsInput("");
      refreshMedications();
    } catch {
      toastError(t("failedPills"));
    }
  };

  const handleMarkTaken = async (item) => {
    setActionMed(null);
    const current = item.availablePills;
    if (current != null && current <= 0) {
      toastWarning(t("refillNeeded"));
      return;
    }
    try {
      await updatePills(item.id, current != null ? current - 1 : 0);
      if (current != null && current - 1 <= 0) {
        toastWarning(t("refillNeeded"));
      }
      refreshMedications();
    } catch {
      toastError(t("medUpdateFailed"));
    }
  };

  const handleSnooze = () => {
    setActionMed(null);
    toastSuccess(t("snoozedMessage"));
  };

  const showActionMenu = (item) => {
    setActionMed(item);
  };

  return (
    <View style={[tw`flex-1`, { backgroundColor: theme.surface }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView style={{ flex: 1 }}>
        <View
          style={[
            tw`flex-row items-center justify-between`,
            {
              paddingHorizontal: hs(24),
              backgroundColor: isDark ? theme.surface : "rgba(255,255,255,0.8)",
              minHeight: vs(64),
            },
          ]}
        >
          <View style={[tw`flex-row items-center`, { gap: hs(12)}]}>
            <UserAvatar size={hs(36)} onPress={() => router.push("/settings")} />
            <Text style={[{ fontSize: fontScale(24), fontWeight: "800", letterSpacing: -0.5 }, { color: theme.primary }]}>{userName || "Pharma"}</Text>
          </View>
          <SettingsButton />
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: hs(24), paddingBottom: vs(192) }}>
          <View style={{ marginTop: vs(24) }}>
            <Text style={[{ fontSize: fontScale(36), fontWeight: "800", letterSpacing: -0.5 }, { color: theme.onSurface }]}>
              {t("myMedications")}
            </Text>
            <Text style={[{ fontSize: fontScale(18), marginTop: vs(4), maxWidth: hs(280) }, { color: theme.onSurfaceVariant }]}>
              {scheduledMeds.length === 1 ? t("scheduleClear") : t("scheduleClearPlural", { count: scheduledMeds.length })}
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={theme.primary} style={tw`mt-20`} />
          ) : error && !offline ? (
            <ErrorState message={t("couldNotLoad")} onRetry={refreshMedications} />
          ) : (
            <>
              {offline && (
                <ErrorState banner offline message={t("offlineModeDesc")} />
              )}
              {nextMed && (
                <View
                  style={[
                    tw`relative overflow-hidden`,
                    {
                      backgroundColor: theme.surfaceContainerLowest,
                      borderRadius: hs(16),
                      padding: hs(24),
                      marginTop: vs(24),
                      ...webShadow({ elevation: 4, color: isDark ? "#000" : theme.primary, opacity: isDark ? 0.2 : 0.06, radius: 20, offsetY: 10 }),
                    },
                  ]}
                >
                  <View style={[{ position: "absolute", top: 0, right: 0, width: hs(128), height: hs(128), borderBottomLeftRadius: hs(64), opacity: 0.3 }, { backgroundColor: theme.primaryContainer }]} />
                  <TouchableOpacity
                    onPress={() => showActionMenu(nextMed)}
                    style={[{ position: "absolute", top: hs(12), right: hs(12), zIndex: 20, width: hs(32), height: hs(32), alignItems: "center", justifyContent: "center", borderRadius: hs(16) }, { backgroundColor: isDark ? theme.surfaceContainerLow : "rgba(255,255,255,0.8)" }]}
                  >
                    <MaterialCommunityIcons name="dots-vertical" size={hs(18)} color={theme.onSurfaceVariant} />
                  </TouchableOpacity>
                  {nextMed.refillRisk && (
                    <View style={[{ position: "absolute", top: hs(12), left: hs(12), zIndex: 10, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#fef3c7", paddingHorizontal: hs(12), paddingVertical: 4, borderRadius: hs(16) }]}>
                      <MaterialCommunityIcons name="alert-triangle" size={hs(14)} color="#d97706" />
                      <Text style={{ fontSize: fontScale(10), fontWeight: "700", color: "#d97706", textTransform: "uppercase" }}>{t("refillSoon")}</Text>
                    </View>
                  )}
                  <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", position: "relative", zIndex: 10, marginTop: vs(16) }}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={[{ fontSize: fontScale(12), fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" }, { color: theme.primary }]}>
                        {t("upNext", { time: nextMed.time })}
                      </Text>
                      <Text style={[{ fontSize: fontScale(24), fontWeight: "700", marginTop: vs(4) }, { color: theme.onSurface }]}>
                        {nextMed.name}
                      </Text>
                      <Text style={[{ fontSize: fontScale(16), color: theme.onSurfaceVariant }]}>{nextMed.dose}</Text>
                      {nextMed.availablePills != null && (
                        <Text style={[{ fontSize: fontScale(12), marginTop: vs(4) }, { color: theme.onSurfaceVariant }]}>
                          {t("pillsRemaining", { count: nextMed.availablePills })}
                        </Text>
                      )}
                      {nextMed.instructions && (
                        <Text style={[{ fontSize: fontScale(12), fontStyle: "italic", marginTop: vs(4) }, { color: theme.onSurfaceVariant }]}>
                          {nextMed.instructions}
                        </Text>
                      )}
                      {nextMed.instructionsAfter && (
                        <Text style={[{ fontSize: fontScale(12), fontStyle: "italic", marginTop: vs(4) }, { color: theme.onSurfaceVariant }]}>
                          {nextMed.instructionsAfter}
                        </Text>
                      )}
                    </View>
                    <View style={[{ width: hs(56), height: hs(56), borderRadius: hs(28), alignItems: "center", justifyContent: "center" }, { backgroundColor: theme.secondaryContainer }]}>
                      <MaterialCommunityIcons name={nextMed.icon || "pill"} size={hs(28)} color={theme.primary} />
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: vs(24), gap: hs(16) }}>
                    <TouchableOpacity
                      style={[{
                        paddingHorizontal: hs(24),
                        paddingVertical: vs(12),
                        borderRadius: hs(24),
                        backgroundColor: theme.primary,
                        ...webShadow({ elevation: 6, color: theme.primary, radius: 10, offsetY: 6 }),
                      }]}
                      onPress={() => handleMarkTaken(nextMed)}
                    >
                      <Text style={{ fontSize: fontScale(16), fontWeight: "700", color: "white" }}>{t("markAsTaken")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ paddingHorizontal: hs(16), paddingVertical: vs(12), borderRadius: hs(24) }} onPress={handleSnooze}>
                      <Text style={[{ fontSize: fontScale(16), fontWeight: "700" }, { color: theme.primary }]}>{t("snooze")}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {otherMeds.length > 0 && (
                <View style={{ marginTop: vs(32), gap: vs(24) }}>
                  <Text style={[{ fontSize: fontScale(20), fontWeight: "700" }, { color: theme.onSurface }]}>{t("laterToday")}</Text>
                  <View style={{ gap: vs(12) }}>
                    {otherMeds.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.7}
                        style={[{ borderRadius: hs(16), padding: hs(20), flexDirection: "row", alignItems: "center", gap: hs(20) }, { backgroundColor: theme.surfaceContainerLow }]}
                      >
                        <View style={[{ width: hs(48), height: hs(48), borderRadius: hs(24), alignItems: "center", justifyContent: "center" }, { backgroundColor: theme.surfaceContainerLowest }]}>
                          <MaterialCommunityIcons
                            name={item.icon === "Inhaler" ? "asthma" : item.icon || "pill"}
                            size={hs(24)}
                            color={theme.primary}
                          />
                        </View>
                        <View style={{ flex: 1, gap: 2 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: hs(8) }}>
                            <Text style={[{ fontSize: fontScale(18), fontWeight: "700" }, { color: theme.onSurface }]}>{item.name}</Text>
                            {item.refillRisk && (
                              <MaterialCommunityIcons name="alert-triangle" size={hs(14)} color="#d97706" />
                            )}
                          </View>
                          <Text style={[{ fontSize: fontScale(16), color: theme.onSurfaceVariant }]}>{item.dose}</Text>
                          {item.availablePills != null && (
                            <Text style={[{ fontSize: fontScale(14), color: theme.onSurfaceVariant }]}>
                              {item.availablePills} {t("pills")}
                            </Text>
                          )}
                        </View>
                        {item.isAsNeeded ? (
                          <View style={[{ paddingHorizontal: hs(12), paddingVertical: vs(6), borderRadius: hs(16) }, { backgroundColor: theme.secondaryContainer }]}>
                            <Text style={[{ fontSize: fontScale(10), fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }, { color: theme.onSecondaryContainer }]}>
                              {t("asNeeded")}
                            </Text>
                          </View>
                        ) : (
                          <Text style={[{ fontSize: fontScale(16), fontWeight: "700" }, { color: theme.onSurface }]}>{item.time}</Text>
                        )}
                        <TouchableOpacity onPress={() => showActionMenu(item)} style={{ padding: hs(4) }}>
                          <MaterialCommunityIcons name="dots-vertical" size={hs(18)} color={theme.onSurfaceVariant} />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {meds.length === 0 && (
                <View style={{ alignItems: "center", marginTop: vs(80) }}>
                  <MaterialCommunityIcons name="pill-off" size={hs(48)} color={theme.outlineVariant} />
                  <Text style={[{ fontSize: fontScale(18), marginTop: vs(16), textAlign: "center" }, { color: theme.onSurfaceVariant }]}>
                    {t("noMedsYet")}
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>

        <TouchableOpacity
          onPress={() => router.push("/BrowseMedications")}
          style={{
            position: "absolute",
            bottom: vs(120),
            right: hs(24),
            width: hs(64),
            height: hs(64),
            borderRadius: hs(32),
            alignItems: "center",
            justifyContent: "center",
            zIndex: 40,
            backgroundColor: theme.primary,
            ...webShadow({ elevation: 8, color: theme.primary, radius: 15, offsetY: 8 }),
          }}
        >
          <MaterialCommunityIcons name="plus" size={hs(32)} color="white" />
        </TouchableOpacity>

        <Modal visible={!!actionMed && !showPillsModal} transparent animationType="fade" onRequestClose={() => setActionMed(null)}>
          <TouchableOpacity style={tw`flex-1 bg-black/40 justify-end`} activeOpacity={1} onPress={() => setActionMed(null)}>
            <View style={[{ borderTopLeftRadius: hs(24), borderTopRightRadius: hs(24), paddingHorizontal: hs(24), paddingTop: vs(24), paddingBottom: vs(40) }, { backgroundColor: theme.surface }]}>
              <Text style={[{ fontSize: fontScale(18), fontWeight: "700", marginBottom: vs(16) }, { color: theme.onSurface }]}>{t("actions")}</Text>
              {actionMed?.isActive !== false ? (
                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center", gap: hs(16), paddingVertical: vs(16), borderBottomWidth: 1, borderBottomColor: theme.outlineVariant }}
                  onPress={() => handleToggle(actionMed)}
                >
                  <MaterialCommunityIcons name="pause-circle-outline" size={hs(24)} color={theme.primary} />
                  <Text style={[{ fontSize: fontScale(16), color: theme.onSurface }]}>{t("makeInactive")}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center", gap: hs(16), paddingVertical: vs(16), borderBottomWidth: 1, borderBottomColor: theme.outlineVariant }}
                  onPress={() => handleToggle(actionMed)}
                >
                  <MaterialCommunityIcons name="play-circle-outline" size={hs(24)} color={theme.primary} />
                  <Text style={[{ fontSize: fontScale(16), color: theme.onSurface }]}>{t("makeActive")}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center", gap: hs(16), paddingVertical: vs(16), borderBottomWidth: 1, borderBottomColor: theme.outlineVariant }}
                onPress={() => { setShowPillsModal(true); setPillsInput(String(actionMed?.availablePills || "")); }}
              >
                <MaterialCommunityIcons name="pill" size={hs(24)} color={theme.primary} />
                <Text style={[{ fontSize: fontScale(16), color: theme.onSurface }]}>{t("updatePills")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center", gap: hs(16), paddingVertical: vs(16) }}
                onPress={() => handleDelete(actionMed)}
              >
                <MaterialCommunityIcons name="delete-outline" size={hs(24)} color={theme.error} />
                <Text style={[{ fontSize: fontScale(16), color: theme.error }]}>{t("removeFromWallet")}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal visible={showPillsModal} transparent animationType="fade" onRequestClose={() => setShowPillsModal(false)}>
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", paddingHorizontal: hs(32) }}>
            <View style={[{ borderRadius: hs(16), padding: hs(24) }, { backgroundColor: theme.surface }]}>
              <Text style={[{ fontSize: fontScale(18), fontWeight: "700", marginBottom: vs(16) }, { color: theme.onSurface }]}>{t("enterPillsCount")}</Text>
              <TextInput
                style={[{ borderRadius: hs(12), paddingHorizontal: hs(16), paddingVertical: vs(12), fontSize: fontScale(16), marginBottom: vs(16) }, { backgroundColor: theme.surfaceContainerLow, color: theme.onSurface }]}
                keyboardType="numeric"
                value={pillsInput}
                onChangeText={setPillsInput}
                placeholder="0"
                placeholderTextColor={theme.onSurfaceVariant}
              />
              <View style={{ flexDirection: "row", gap: hs(12) }}>
                <TouchableOpacity
                  style={[{ flex: 1, paddingVertical: vs(12), borderRadius: hs(12), alignItems: "center" }, { backgroundColor: theme.surfaceContainerLow }]}
                  onPress={() => { setShowPillsModal(false); setPillsInput(""); }}
                >
                  <Text style={[{ fontSize: fontScale(16), fontWeight: "700" }, { color: theme.onSurfaceVariant }]}>{t("cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[{ flex: 1, paddingVertical: vs(12), borderRadius: hs(12), alignItems: "center" }, { backgroundColor: theme.primary }]}
                  onPress={handlePillsSave}
                >
                  <Text style={{ fontSize: fontScale(16), fontWeight: "700", color: "white" }}>{t("save")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>

      <View style={tw`absolute bottom-0 left-0 right-0 z-50`}>
        <BottomNavBar activeTab="Meds" />
      </View>
    </View>
  );
}
