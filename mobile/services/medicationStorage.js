import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const LEGACY_STORAGE_KEY = "@medication_reminders";
const IDS_KEY = "@medication_reminder_ids";
const ENTRY_PREFIX = "medication_";
const MEDS_CACHE_KEY = "@meds_ui_cache";

const entryKey = (id) => `${ENTRY_PREFIX}${id}`;

const memoryCache = {};

const secureGet = async (key) => {
  if (memoryCache[key]) return memoryCache[key];
  try {
    const value = await SecureStore.getItemAsync(key);
    if (value) memoryCache[key] = value;
    return value;
  } catch (e) {
    console.warn("[MedStorage] SecureStore get error:", e);
    return null;
  }
};

const secureSet = async (key, value) => {
  memoryCache[key] = value;
  try {
    await SecureStore.setItemAsync(key, value);
    return true;
  } catch (e) {
    console.warn("[MedStorage] SecureStore set error:", e);
    return false;
  }
};

const secureDelete = async (key) => {
  delete memoryCache[key];
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (e) {
    console.warn("[MedStorage] SecureStore delete error:", e);
  }
};

const getIds = async () => {
  const raw = await secureGet(IDS_KEY);
  try {
    const ids = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
};

const setIds = async (ids) => {
  await secureSet(IDS_KEY, JSON.stringify(ids));
};

export const saveMedsCache = async (medications) => {
  try {
    await AsyncStorage.setItem(MEDS_CACHE_KEY, JSON.stringify(medications));
  } catch (e) {
    console.warn("[MedStorage] cache save error:", e);
  }
};

export const getMedsCache = async () => {
  try {
    const data = await AsyncStorage.getItem(MEDS_CACHE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.warn("[MedStorage] cache get error:", e);
    return [];
  }
};

export const saveMedications = async (medications) => {
  const existingIds = await getIds();
  const nextIds = new Set(existingIds);

  const stored = [];
  for (const med of medications) {
    const id = String(med.medication_id);
    const value = JSON.stringify(med);
    const ok = await secureSet(entryKey(id), value);
    if (ok) {
      nextIds.add(id);
      stored.push(med);
    } else {
      // Fallback for oversized values: keep the reminder usable in AsyncStorage.
      try {
        await AsyncStorage.setItem(entryKey(id), value);
        nextIds.add(id);
        stored.push(med);
      } catch (e) {
        console.warn("[MedStorage] reminder fallback save error:", e);
      }
    }
  }

  await setIds([...nextIds]);
  return stored;
};

const migrateLegacy = async () => {
  try {
    const raw = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return;
    const legacy = JSON.parse(raw);
    if (Array.isArray(legacy) && legacy.length > 0) {
      await saveMedications(legacy);
    }
    await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (e) {
    console.warn("[MedStorage] legacy migration error:", e);
  }
};

export const getMedications = async () => {
  await migrateLegacy();

  const ids = await getIds();
  if (ids.length === 0) return [];

  const medications = [];
  for (const id of ids) {
    const value = await secureGet(entryKey(id));
    if (!value) {
      try {
        const fallback = await AsyncStorage.getItem(entryKey(id));
        if (fallback) medications.push(JSON.parse(fallback));
      } catch {}
      continue;
    }
    try {
      medications.push(JSON.parse(value));
    } catch {
      console.warn(`[MedStorage] corrupt entry for ${id}`);
    }
  }

  return medications;
};

export const removeMedication = async (medicationId) => {
  const id = String(medicationId);
  const ids = (await getIds()).filter((x) => x !== id);
  await setIds(ids);
  await secureDelete(entryKey(id));
  try {
    await AsyncStorage.removeItem(entryKey(id));
  } catch {}
  return ids;
};

export const clearMedications = async () => {
  const ids = await getIds();
  for (const id of ids) {
    await secureDelete(entryKey(id));
    try {
      await AsyncStorage.removeItem(entryKey(id));
    } catch {}
  }
  await setIds([]);
};

export const clearMedsCache = async () => {
  try {
    await AsyncStorage.removeItem(MEDS_CACHE_KEY);
  } catch (e) {
    console.warn("[MedStorage] cache clear error:", e);
  }
};
