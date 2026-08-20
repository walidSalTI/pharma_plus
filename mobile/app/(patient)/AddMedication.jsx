import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import tw from "twrnc";
import { addToWallet } from "@/services/walletService";
import { getMyDiseases, getChronicDiseases } from "@/services/diseaseService";
import { getDiseaseIcon } from "@/constants/conditionIcons";
import { saveMedications } from "@/services/medicationStorage";
import { scheduleMedicationReminders, cancelAllReminders } from "@/services/notificationService";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useToast } from "@/src/context/ToastContext";
import { webShadow } from "@/constants/shadow";
import { useResponsive } from "@/constants/responsive";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const normalizeTime = (timeStr) => {
  if (!timeStr) return timeStr;
  return String(timeStr)
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
    .replace(/\s*ص\s*$/, " AM")
    .replace(/\s*م\s*$/, " PM");
};

const to24Hour = (timeStr) => {
  const normalized = normalizeTime(timeStr);
  if (!normalized) return "12:00";
  const [time, modifier] = normalized.trim().split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const formatTime = (date) => {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${ampm}`;
};

const getChronicId = (d) => d.id ?? null;

export default function AddMedication() {
  const router = useRouter();
  const { t } = useLanguage();
  const { theme, isDark } = useAppTheme();
  const { hs, vs, fontScale, isTablet } = useResponsive();
  const { success: toastSuccess, error: toastError } = useToast();
  const { selectedMeds } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [chronicDiseases, setChronicDiseases] = useState([]);

  const [medications, setMedications] = useState(() => {
    try {
      const parsed = JSON.parse(selectedMeds || "[]");
      return parsed.map((med) => ({
        medication_id: String(med.id),
        name: med.name || med.trade_name,
        dosage: "",
        available_pills: "",
        state: "permanent",
        instructions_before: "",
        instructions_after: "",
        frequency: 1,
        times: ["08:00 AM"],
        selectedDays: [0, 1, 2, 3, 4, 5, 6],
        chronic_id: null,
      }));
    } catch {
      return [];
    }
  });

  useEffect(() => {
    (async () => {
      try {
        const [catalog, myRecords] = await Promise.all([getChronicDiseases(), getMyDiseases()]);
        const catalogArr = Array.isArray(catalog) ? catalog : [];
        const recordsArr = Array.isArray(myRecords) ? myRecords : [];
        const display = recordsArr
          .map((record) => {
            const entry = catalogArr.find((c) => c.id === record.chronic_disease_id);
            return { ...record, name_en: entry?.name_en, name_ar: entry?.name_ar };
          })
          .filter((d) => d.name_en || d.name_ar);
        setChronicDiseases(display);
      } catch {
        setChronicDiseases([]);
      }
    })();
  }, []);

  const [showPicker, setShowPicker] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);
  const [activeTimeIndex, setActiveTimeIndex] = useState(null);
  const [tempDate, setTempDate] = useState(new Date());

  const generateTimes = (count) => {
    const times = [];
    const interval = 24 / count;
    for (let i = 0; i < count; i++) {
      const date = new Date();
      date.setHours(8 + i * interval, 0, 0, 0);
      times.push(formatTime(date));
    }
    return times;
  };

  const updateMed = (index, updates) => {
    setMedications((prev) =>
      prev.map((m, i) => (i === index ? { ...m, ...updates } : m)),
    );
  };

  const toggleDay = (medIndex, day) => {
    setMedications((prev) =>
      prev.map((m, i) => {
        if (i !== medIndex) return m;
        const days = m.selectedDays.includes(day)
          ? m.selectedDays.filter((d) => d !== day)
          : [...m.selectedDays, day].sort();
        return { ...m, selectedDays: days };
      }),
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const reminders = [];

      for (const med of medications) {
        if (!med.dosage.trim()) {
          toastError(`${t("dosage")} required: ${med.name}`);
          setLoading(false);
          return;
        }

        const allDays = med.selectedDays.length === 7;
        const frequency = allDays ? "daily" : "specific_days";

        const schedules = allDays
          ? med.times.map((t) => ({ dose_time: to24Hour(t) }))
          : med.times.flatMap((t) => {
              const time24 = to24Hour(t);
              return med.selectedDays.map((day) => ({
                dose_time: time24,
                day_of_week: day,
              }));
            });

        const payload = {
          medication_id: String(med.medication_id),
          state: med.state,
          chronic_id: med.chronic_id || null,
          dosage: med.dosage,
          available_pills: parseInt(med.available_pills, 10) || 0,
          frequency: frequency,
          instructions_before: med.instructions_before.trim() || null,
          instructions_after: med.instructions_after.trim() || null,
          is_active: true,
          schedules: schedules,
        };

        await addToWallet(payload);

        reminders.push({
          medication_id: String(med.medication_id),
          name: med.name,
          dosage: med.dosage,
          is_active: true,
          schedules,
        });
      }

      await saveMedications(reminders);
      await cancelAllReminders();
      await scheduleMedicationReminders(reminders);

      toastSuccess(t("addedToWallet"));
      router.replace("/(patient)/MedicationsScreen");
    } catch (e) {
      toastError(e.message || t("failedSave"));
    } finally {
      setLoading(false);
    }
  };

  const stringToDate = (timeStr) => {
    const normalized = normalizeTime(timeStr);
    const [time, modifier] = (normalized || "12:00 AM").split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const handleTimeChangePicker = (event, selectedDate) => {
    if (Platform.OS === "android") setShowPicker(false);
    if (!selectedDate || event.type === "dismissed") return;

    setMedications((prev) =>
      prev.map((med, i) => {
        if (i === activeIndex) {
          const newTimes = [...med.times];
          newTimes[activeTimeIndex] = formatTime(selectedDate);
          return { ...med, times: newTimes };
        }
        return med;
      }),
    );
  };

  const handleFrequencyChange = (index, delta) => {
    setMedications((prev) =>
      prev.map((m, i) => {
        if (i !== index) return m;
        const next = Math.min(4, Math.max(1, (m.frequency || 1) + delta));
        return { ...m, frequency: next, times: generateTimes(next) };
      }),
    );
  };

  const SectionLabel = ({ children }) => (
    <Text
      style={{
        fontSize: fontScale(11),
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 1.2,
        marginBottom: vs(10),
        color: theme.onSurfaceVariant,
      }}
    >
      {children}
    </Text>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.surface }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView style={{ flex: 1 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            position: "absolute",
            top: vs(12),
            left: hs(16),
            zIndex: 20,
            width: hs(40),
            height: hs(40),
            borderRadius: hs(20),
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.surfaceContainerLow,
          }}
        >
          <MaterialCommunityIcons name="arrow-left" size={hs(22)} color={theme.primary} />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: isTablet ? hs(120) : hs(24),
            paddingBottom: vs(224),
            paddingTop: vs(64),
          }}
          showsVerticalScrollIndicator={false}
        >
          {medications.map((med, index) => (
            <View
              key={index}
              style={[
                {
                  marginBottom: vs(20),
                  borderRadius: hs(20),
                  backgroundColor: theme.surfaceContainerLowest,
                  overflow: "hidden",
                  ...webShadow({ elevation: 4, opacity: isDark ? 0.15 : 0.05, radius: 16, offsetY: 6 }),
                },
              ]}
            >
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: hs(100),
                  height: hs(100),
                  borderBottomLeftRadius: hs(50),
                  opacity: 0.25,
                  backgroundColor: theme.primaryContainer,
                }}
              />

              <View style={{ padding: hs(20) }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: hs(12), marginBottom: vs(24) }}>
                  <View
                    style={[
                      { width: hs(44), height: hs(44), borderRadius: hs(22), alignItems: "center", justifyContent: "center" },
                      { backgroundColor: theme.primaryContainer },
                    ]}
                  >
                    <MaterialCommunityIcons name="pill" size={hs(22)} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1, position: "relative", zIndex: 10 }}>
                    <Text style={{ fontSize: fontScale(18), fontWeight: "700", color: theme.onSurface }}>
                      {med.name}
                    </Text>
                  </View>
                  <View
                    style={[
                      { paddingHorizontal: hs(12), paddingVertical: vs(6), borderRadius: hs(16) },
                      { backgroundColor: theme.secondaryContainer },
                    ]}
                  >
                    <Text style={{ fontSize: fontScale(11), fontWeight: "700", color: theme.onSecondaryContainer }}>
                      #{index + 1}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", gap: hs(12) }}>
                  <View style={{ flex: 1 }}>
                    <SectionLabel>{t("dosage")}</SectionLabel>
                    <TextInput
                      style={[
                        {
                          borderRadius: hs(14),
                          backgroundColor: theme.surfaceContainerLow,
                          borderWidth: 1,
                          paddingHorizontal: hs(16),
                          height: vs(50),
                          fontSize: fontScale(15),
                          color: theme.onSurface,
                        },
                        { borderColor: theme.outlineVariant },
                      ]}
                      placeholder={t("dosagePlaceholder")}
                      placeholderTextColor={theme.outline}
                      value={med.dosage}
                      onChangeText={(v) => updateMed(index, { dosage: v })}
                    />
                  </View>
                  <View style={{ width: hs(96) }}>
                    <SectionLabel>{t("pills")}</SectionLabel>
                    <TextInput
                      style={[
                        {
                          borderRadius: hs(14),
                          backgroundColor: theme.surfaceContainerLow,
                          borderWidth: 1,
                          paddingHorizontal: hs(16),
                          height: vs(50),
                          fontSize: fontScale(15),
                          color: theme.onSurface,
                        },
                        { borderColor: theme.outlineVariant },
                      ]}
                      placeholder={t("qty")}
                      placeholderTextColor={theme.outline}
                      keyboardType="numeric"
                      value={med.available_pills}
                      onChangeText={(v) => updateMed(index, { available_pills: v })}
                    />
                  </View>
                </View>

                <View style={{ marginTop: vs(20) }}>
                  <SectionLabel>{t("type")}</SectionLabel>
                  <View
                    style={[
                      {
                        flexDirection: "row",
                        borderRadius: hs(14),
                        padding: vs(4),
                        backgroundColor: theme.surfaceContainerLow,
                      },
                    ]}
                  >
                    {["permanent", "temporary"].map((type) => (
                      <TouchableOpacity
                        key={type}
                        onPress={() => updateMed(index, { state: type })}
                        style={[
                          {
                            flex: 1,
                            paddingVertical: vs(12),
                            borderRadius: hs(12),
                            alignItems: "center",
                          },
                          med.state === type
                            ? {
                                backgroundColor: theme.primary,
                                ...webShadow({ elevation: 4, color: theme.primary, radius: 8, offsetY: 3 }),
                              }
                            : { backgroundColor: "transparent" },
                        ]}
                      >
                        <Text
                          style={[
                            { fontSize: fontScale(13), fontWeight: "700" },
                            med.state === type ? { color: "white" } : { color: theme.onSurfaceVariant },
                          ]}
                        >
                          {t(type)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {chronicDiseases.length > 0 && (
                  <View style={{ marginTop: vs(20) }}>
                    <SectionLabel>{t("chronicConditions")}</SectionLabel>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {chronicDiseases.map((d) => {
                        const cid = getChronicId(d);
                        const isSelected = med.chronic_id === cid;
                        return (
                          <TouchableOpacity
                            key={d.id}
                            disabled={!cid}
                            onPress={() => updateMed(index, { chronic_id: isSelected ? null : cid })}
                            style={[
                              {
                                flexDirection: "row",
                                alignItems: "center",
                                gap: hs(6),
                                paddingHorizontal: hs(14),
                                paddingVertical: vs(8),
                                borderRadius: hs(20),
                                marginRight: hs(8),
                                opacity: cid ? 1 : 0.4,
                              },
                              isSelected
                                ? {
                                    backgroundColor: theme.primary,
                                    ...webShadow({ elevation: 3, color: theme.primary, radius: 6, offsetY: 2 }),
                                  }
                                : { backgroundColor: theme.surfaceContainerLow, borderWidth: 1, borderColor: theme.outlineVariant },
                            ]}
                          >
                            <MaterialCommunityIcons
                              name={getDiseaseIcon(d)}
                              size={hs(16)}
                              color={isSelected ? "white" : theme.onSurfaceVariant}
                            />
                            <Text
                              style={[
                                { fontSize: fontScale(12), fontWeight: "700" },
                                { color: isSelected ? "white" : theme.onSurfaceVariant },
                              ]}
                            >
                              {d.name_en || d.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                <View style={{ marginTop: vs(20) }}>
                  <SectionLabel>{t("instrBefore")}</SectionLabel>
                  <TextInput
                    style={[
                      {
                        borderRadius: hs(14),
                        backgroundColor: theme.surfaceContainerLow,
                        borderWidth: 1,
                        paddingHorizontal: hs(16),
                        height: vs(50),
                        fontSize: fontScale(15),
                        color: theme.onSurface,
                      },
                      { borderColor: theme.outlineVariant },
                    ]}
                    placeholder={t("instrPlaceholder")}
                    placeholderTextColor={theme.outline}
                    value={med.instructions_before}
                    onChangeText={(v) => updateMed(index, { instructions_before: v })}
                  />
                </View>

                <View style={{ marginTop: vs(16) }}>
                  <SectionLabel>{t("instrAfter")}</SectionLabel>
                  <TextInput
                    style={[
                      {
                        borderRadius: hs(14),
                        backgroundColor: theme.surfaceContainerLow,
                        borderWidth: 1,
                        paddingHorizontal: hs(16),
                        height: vs(50),
                        fontSize: fontScale(15),
                        color: theme.onSurface,
                      },
                      { borderColor: theme.outlineVariant },
                    ]}
                    placeholder={t("instrPlaceholder")}
                    placeholderTextColor={theme.outline}
                    value={med.instructions_after}
                    onChangeText={(v) => updateMed(index, { instructions_after: v })}
                  />
                </View>

                <View style={{ marginTop: vs(24) }}>
                  <SectionLabel>{t("dailyFreq")}</SectionLabel>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: hs(12),
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => handleFrequencyChange(index, -1)}
                      disabled={med.frequency <= 1}
                      style={[
                        {
                          width: hs(44),
                          height: hs(44),
                          borderRadius: hs(22),
                          alignItems: "center",
                          justifyContent: "center",
                          borderWidth: 1.5,
                          borderColor: theme.primary,
                        },
                        {
                          backgroundColor: med.frequency <= 1 ? theme.surfaceContainerLow : theme.surfaceContainerLowest,
                          opacity: med.frequency <= 1 ? 0.35 : 1,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons name="minus" size={hs(20)} color={theme.primary} />
                    </TouchableOpacity>

                    <View
                      style={[
                        {
                          flex: 1,
                          paddingVertical: vs(14),
                          borderRadius: hs(14),
                          alignItems: "center",
                          backgroundColor: theme.primary,
                          ...webShadow({ elevation: 4, color: theme.primary, radius: 8, offsetY: 3 }),
                        },
                      ]}
                    >
                      <Text style={{ fontSize: fontScale(16), fontWeight: "700", color: "white" }}>
                        {med.frequency} {t("xPerDay")}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleFrequencyChange(index, 1)}
                      disabled={med.frequency >= 4}
                      style={[
                        {
                          width: hs(44),
                          height: hs(44),
                          borderRadius: hs(22),
                          alignItems: "center",
                          justifyContent: "center",
                          borderWidth: 1.5,
                          borderColor: theme.primary,
                        },
                        {
                          backgroundColor: med.frequency >= 4 ? theme.surfaceContainerLow : theme.surfaceContainerLowest,
                          opacity: med.frequency >= 4 ? 0.35 : 1,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons name="plus" size={hs(20)} color={theme.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={{ marginTop: vs(24) }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: vs(12) }}>
                    <SectionLabel>{t("daysOfWeek")}</SectionLabel>
                    <Text style={{ fontSize: fontScale(12), fontWeight: "700", color: theme.primary }}>
                      {med.selectedDays.length}/7
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: hs(8) }}>
                    {DAYS.map((day, di) => {
                      const isActive = med.selectedDays.includes(di);
                      return (
                        <TouchableOpacity
                          key={day}
                          onPress={() => toggleDay(index, di)}
                          activeOpacity={0.7}
                          style={[
                            {
                              paddingHorizontal: hs(16),
                              paddingVertical: vs(10),
                              borderRadius: hs(24),
                            },
                            isActive
                              ? {
                                  backgroundColor: theme.primary,
                                  ...webShadow({ elevation: 3, color: theme.primary, radius: 6, offsetY: 2 }),
                                }
                              : {
                                  backgroundColor: theme.surfaceContainerLow,
                                  borderWidth: 1,
                                  borderColor: theme.outlineVariant,
                                },
                          ]}
                        >
                          <Text
                            style={{
                              fontSize: fontScale(13),
                              fontWeight: "600",
                              color: isActive ? "white" : theme.onSurfaceVariant,
                            }}
                          >
                            {day}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={{ marginTop: vs(24) }}>
                  <SectionLabel>{t("times")}</SectionLabel>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: hs(12) }}>
                    {med.times.map((time, tidx) => (
                      <TouchableOpacity
                        key={tidx}
                        activeOpacity={0.7}
                        onPress={() => {
                          setActiveIndex(index);
                          setActiveTimeIndex(tidx);
                          setTempDate(stringToDate(time));
                          setShowPicker(true);
                        }}
                        style={[
                          {
                            flexDirection: "row",
                            alignItems: "center",
                            gap: hs(10),
                            paddingHorizontal: hs(20),
                            paddingVertical: vs(14),
                            borderRadius: hs(14),
                            minWidth: hs(150),
                          },
                          {
                            backgroundColor: theme.surfaceContainerLow,
                            borderWidth: 1,
                            borderColor: theme.outlineVariant,
                          },
                        ]}
                      >
                        <View
                          style={[
                            { width: hs(32), height: hs(32), borderRadius: hs(16), alignItems: "center", justifyContent: "center" },
                            { backgroundColor: theme.primaryContainer },
                          ]}
                        >
                          <MaterialCommunityIcons name="clock-outline" size={hs(16)} color={theme.primary} />
                        </View>
                        <Text style={{ fontSize: fontScale(16), fontWeight: "700", color: theme.onSurface }}>
                          {time}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {showPicker && (
          <DateTimePicker
            key={`${activeIndex}-${activeTimeIndex}`}
            value={tempDate}
            mode="time"
            is24Hour={false}
            display={Platform.OS === "ios" ? "spinner" : "clock"}
            onChange={handleTimeChangePicker}
          />
        )}

        {medications.length > 0 && (
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
              onPress={handleSave}
              disabled={loading}
              style={[
                {
                  height: vs(60),
                  borderRadius: hs(16),
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: hs(10),
                  backgroundColor: theme.primary,
                },
                webShadow({ elevation: 6, color: theme.primary, radius: 12, offsetY: 6 }),
                { opacity: loading ? 0.7 : 1 },
              ]}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check-bold" size={hs(22)} color="white" />
                  <Text numberOfLines={1} style={{ fontSize: fontScale(16), fontWeight: "700", color: "white" }}>
                    {t("saveSchedule")}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}
