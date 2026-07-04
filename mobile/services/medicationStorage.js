import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@medication_reminders";

export const saveMedications = async (medications) => {
  try {
    const existing = await getMedications();
    const merged = [...existing, ...medications];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch (e) {
    console.warn("[MedStorage] save error:", e);
  }
};

export const getMedications = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.warn("[MedStorage] get error:", e);
    return [];
  }
};

export const removeMedication = async (medicationId) => {
  try {
    const existing = await getMedications();
    const filtered = existing.filter((m) => m.medication_id !== medicationId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
  } catch (e) {
    console.warn("[MedStorage] remove error:", e);
  }
};

export const clearMedications = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn("[MedStorage] clear error:", e);
  }
};
