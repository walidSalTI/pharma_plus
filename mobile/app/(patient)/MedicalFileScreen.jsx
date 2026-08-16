import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import tw from "twrnc";
import BottomNavBar from "@/components/BottomNavBar";
import ConditionCard from "@/components/ConditionCard";
import SettingsButton from "@/components/SettingsButton";
import UserAvatar from "@/components/UserAvatar";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { webShadow } from "@/constants/shadow";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useResponsive } from "@/constants/responsive";
import { useUserName } from "@/hooks/useUserName";
import { useCustomAlert } from "@/src/context/CustomAlertContext";
import { getDiseaseIcon } from "@/constants/conditionIcons";
import {
  getChronicDiseases,
  getMyDiseases,
  addDisease,
  deleteDisease,
} from "@/services/diseaseService";

const SEVERITIES = ["low", "medium", "high"];

export default function MedicalFileScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { theme, isDark } = useAppTheme();
  const { hs, vs, fontScale, isTablet } = useResponsive();
  const { userName } = useUserName();
  const { confirm } = useCustomAlert();

  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState([]);
  const [myDiseases, setMyDiseases] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addStep, setAddStep] = useState("select");
  const [selectedDisease, setSelectedDisease] = useState(null);
  const [diagnosisYear, setDiagnosisYear] = useState(new Date().getFullYear().toString());
  const [severity, setSeverity] = useState("low");
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cat, my] = await Promise.all([getChronicDiseases(), getMyDiseases()]);
      setCatalog(Array.isArray(cat) ? cat : []);
      setMyDiseases(Array.isArray(my) ? my : []);
    } catch {
      setCatalog([]);
      setMyDiseases([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isSaved = (diseaseId) => myDiseases.some((d) => d.chronic_disease_id === diseaseId);
  const getSavedRecordId = (diseaseId) => myDiseases.find((d) => d.chronic_disease_id === diseaseId)?.id;

  const handleCardPress = (disease) => {
    const cid = disease.id;
    if (isSaved(cid)) {
      const recordId = getSavedRecordId(cid);
      if (!recordId) return;
      confirm({
        title: t("deleteCondition"),
        message: t("deleteConditionConfirm", { name: disease.name_en }),
        confirmText: t("delete"),
        cancelText: t("cancel"),
        variant: "delete",
        onConfirm: async () => {
          try {
            await deleteDisease(recordId);
            setMyDiseases((prev) => prev.filter((d) => d.id !== recordId));
          } catch {
            fetchData();
          }
        },
      });
    } else {
      setSelectedDisease(disease);
      setAddStep("details");
      setDiagnosisYear(new Date().getFullYear().toString());
      setSeverity("low");
      setShowAddModal(true);
    }
  };

  const openAddModal = () => {
    setAddStep("select");
    setSelectedDisease(null);
    setDiagnosisYear(new Date().getFullYear().toString());
    setSeverity("low");
    setSearchQuery("");
    setShowAddModal(true);
  };

  const handleAddConfirm = async () => {
    if (!selectedDisease) return;
    setSaving(true);
    try {
      await addDisease({
        chronic_disease_id: selectedDisease.id,
        diagnosis_year: parseInt(diagnosisYear, 10) || new Date().getFullYear(),
        severity,
      });
      setShowAddModal(false);
      setSaving(false);
      fetchData();
    } catch {
      setSaving(false);
    }
  };

  const filteredAllForAdd = catalog.filter(
    (d) =>
      d.name_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.name_ar?.includes(searchQuery),
  );

  const renderAddModalContent = () => {
    if (addStep === "select") {
      return (
        <View style={{ flex: 1 }}>
          <Text style={[{ fontSize: fontScale(20), fontWeight: "700", marginBottom: vs(16) }, { color: theme.onSurface }]}>
            {t("selectCondition")}
          </Text>
          <View style={[{ flexDirection: "row", alignItems: "center", paddingHorizontal: hs(16), paddingVertical: vs(12), borderRadius: hs(12), marginBottom: vs(16) }, { backgroundColor: theme.surfaceContainerLow }]}>
            <MaterialCommunityIcons name="magnify" size={hs(22)} color={theme.onSurfaceVariant} />
            <TextInput
              style={{ flex: 1, marginLeft: hs(8), fontSize: fontScale(16) }}
              placeholder={t("searchConditions")}
              placeholderTextColor={theme.onSurfaceVariant}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {filteredAllForAdd.map((disease) => {
              const saved = isSaved(disease.id);
              return (
                <TouchableOpacity
                  key={disease.id}
                  onPress={() => {
                    if (saved) return;
                    setSelectedDisease(disease);
                    setAddStep("details");
                  }}
                  style={[
                    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: hs(16), borderRadius: hs(16), marginBottom: vs(12) },
                    saved
                      ? { backgroundColor: theme.surfaceContainerLow, opacity: 0.6 }
                      : { backgroundColor: theme.surfaceContainerLowest, ...webShadow({ elevation: 1, opacity: 0.04 }) },
                  ]}
                  disabled={saved}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                    <View style={[{ width: hs(40), height: hs(40), borderRadius: hs(20), alignItems: "center", justifyContent: "center" }, { backgroundColor: theme.primaryContainer }]}>
                      <MaterialCommunityIcons name={getDiseaseIcon(disease)} size={hs(22)} color={theme.primary} />
                    </View>
                    <View style={{ marginLeft: hs(12), flex: 1 }}>
                      <Text style={[{ fontSize: fontScale(16), fontWeight: "700" }, { color: theme.onSurface }]}>
                        {disease.name_en}
                      </Text>
                      {disease.name_ar && (
                        <Text style={[{ fontSize: fontScale(12), marginTop: 2 }, { color: theme.onSurfaceVariant }]}>
                          {disease.name_ar}
                        </Text>
                      )}
                    </View>
                  </View>
                  {saved && <MaterialCommunityIcons name="check-circle" size={hs(24)} color={theme.primary} />}
                </TouchableOpacity>
              );
            })}
            {filteredAllForAdd.length === 0 && (
              <Text style={[{ fontSize: fontScale(14), textAlign: "center", marginTop: vs(40) }, { color: theme.onSurfaceVariant }]}>
                {catalog.length === 0 ? t("catalogUnavailable") : t("noMatchFound")}
              </Text>
            )}
          </ScrollView>
        </View>
      );
    }

    if (addStep === "details") {
      return (
        <View style={{ flex: 1 }}>
          <Text style={[{ fontSize: fontScale(24), fontWeight: "700", marginBottom: vs(4) }, { color: theme.onSurface }]}>
            {selectedDisease?.name_en}
          </Text>
          <Text style={[{ fontSize: fontScale(14), marginBottom: vs(32) }, { color: theme.onSurfaceVariant }]}>
            {selectedDisease?.name_ar}
          </Text>
          <Text style={[{ fontSize: fontScale(14), fontWeight: "700", marginBottom: vs(8) }, { color: theme.onSurface }]}>
            {t("diagnosisYear")}
          </Text>
          <TextInput
            style={[{ paddingHorizontal: hs(16), paddingVertical: vs(16), borderRadius: hs(12), marginBottom: vs(24), fontSize: fontScale(16) }, { backgroundColor: theme.surfaceContainerLow, color: theme.onSurface }]}
            placeholder={t("yearPlaceholder")}
            placeholderTextColor={theme.onSurfaceVariant}
            keyboardType="number-pad"
            value={diagnosisYear}
            onChangeText={setDiagnosisYear}
          />
          <Text style={[{ fontSize: fontScale(14), fontWeight: "700", marginBottom: vs(8) }, { color: theme.onSurface }]}>
            {t("severity")}
          </Text>
          <View style={{ flexDirection: "row", gap: hs(8), marginBottom: vs(40) }}>
            {SEVERITIES.map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setSeverity(s)}
                style={[
                  { flex: 1, paddingVertical: vs(12), borderRadius: hs(12), alignItems: "center" },
                  severity === s
                    ? { backgroundColor: theme.primary }
                    : { backgroundColor: theme.surfaceContainerLowest, borderWidth: 1, borderColor: theme.outlineVariant },
                ]}
              >
                <Text style={[{ fontSize: fontScale(14), fontWeight: "700", textTransform: "capitalize" }, { color: severity === s ? "white" : theme.onSurfaceVariant }]}>
                  {t(s)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ flexDirection: "row", gap: hs(12), marginTop: "auto", marginBottom: vs(16) }}>
            <TouchableOpacity
              onPress={() => setAddStep("select")}
              style={[{ flex: 1, paddingVertical: vs(16), borderRadius: hs(12), alignItems: "center" }, { backgroundColor: theme.surfaceContainerLow }]}
            >
              <Text style={[{ fontSize: fontScale(16), fontWeight: "700" }, { color: theme.onSurface }]}>{t("back")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAddConfirm}
              disabled={saving}
              style={[{ flex: 2, paddingVertical: vs(16), borderRadius: hs(12), alignItems: "center" }, { backgroundColor: theme.primary }]}
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ fontSize: fontScale(16), fontWeight: "700", color: "white" }}>{t("confirm")}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={[tw`flex-1`, { backgroundColor: theme.surface }]}>
      <SafeAreaView style={tw`flex-1`}>
        <View style={tw`flex-1`}>
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
            <View style={{ flexDirection: "row", alignItems: "center", gap: hs(12) }}>
              <UserAvatar size={hs(36)} onPress={() => router.push("/settings")} />
              <Text style={[{ fontSize: fontScale(24), fontWeight: "800", letterSpacing: -0.5 }, { color: theme.primary }]}>{userName || "Pharma"}</Text>
            </View>
            <SettingsButton />
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: hs(24), paddingBottom: vs(24), paddingTop: vs(32) }} showsVerticalScrollIndicator={false}>
            <View style={{ marginBottom: vs(32) }}>
              <Text style={[{ fontWeight: "700", textTransform: "uppercase", marginBottom: vs(4), letterSpacing: 1, fontSize: fontScale(11) }, { color: theme.primary }]}>
                {t("patientProfile")}
              </Text>
              <Text style={[{ fontSize: fontScale(30), fontWeight: "800", letterSpacing: -0.5 }, { color: theme.onSurface }]}>
                {t("medicalFile")}
              </Text>
              <Text style={[{ fontSize: fontScale(16), marginTop: vs(8), lineHeight: vs(24) }, { color: theme.onSurfaceVariant }]}>
                {t("medicalFileDesc")}
              </Text>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={theme.primary} style={tw`mt-20`} />
            ) : (
              <>
                <View style={[{ padding: hs(20), borderRadius: hs(24), marginBottom: vs(32) }, { backgroundColor: theme.surfaceContainerLowest, ...webShadow({ elevation: 2, opacity: 0.04 }) }]}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: vs(24) }}>
                    <Text style={[{ fontSize: fontScale(18), fontWeight: "700" }, { color: theme.onSurface }]}>
                      {t("chronicConditions")}
                    </Text>
                    <View style={[{ paddingHorizontal: hs(12), paddingVertical: vs(6), borderRadius: hs(16) }, { backgroundColor: theme.primaryContainer }]}>
                      <Text style={[{ fontSize: fontScale(12), fontWeight: "700" }, { color: theme.primary }]}>
                        {myDiseases.length} {t("selected")}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: isTablet ? "flex-start" : "space-between" }}>
                    {catalog.filter((c) => myDiseases.some((d) => d.chronic_disease_id === c.id)).map((disease) => (
                      <ConditionCard
                        key={disease.id}
                        name={disease.name_en}
                        sub={disease.name_ar}
                        icon={getDiseaseIcon(disease)}
                        selected={true}
                        showIcon={true}
                        onPress={() => handleCardPress(disease)}
                      />
                    ))}
                    <TouchableOpacity
                      onPress={openAddModal}
                      style={[
                        tw`rounded-2xl border-2 border-dashed items-center justify-center mb-4`,
                        {
                          borderColor: theme.outlineVariant,
                          backgroundColor: theme.surfaceContainerLow,
                          width: isTablet ? "31%" : "48%",
                          height: vs(128),
                        },
                      ]}
                    >
                      <MaterialCommunityIcons name="plus" size={hs(32)} color={theme.onSurfaceVariant} />
                      <Text style={[{ fontSize: fontScale(14), fontWeight: "700", marginTop: vs(8) }, { color: theme.onSurfaceVariant }]}>
                        {t("addNew")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </View>

        <BottomNavBar activeTab="Records" />

        <Modal
          visible={showAddModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowAddModal(false)}
        >
          <TouchableOpacity
            style={tw`flex-1 justify-end bg-black/40`}
            activeOpacity={1}
            onPress={() => setShowAddModal(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={[{ borderTopLeftRadius: hs(32), borderTopRightRadius: hs(32), padding: hs(24), paddingTop: vs(12) }, { backgroundColor: theme.surface, height: isTablet ? "70%" : "80%" }]}
            >
              <View style={[{ width: hs(48), height: vs(6), borderRadius: hs(3), alignSelf: "center", marginBottom: vs(24) }, { backgroundColor: theme.outlineVariant }]} />
              {renderAddModalContent()}
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
