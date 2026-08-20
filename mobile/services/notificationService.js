import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SNOOZE_KEY = "@snoozed_notifications";

const isNative = Platform.OS !== "web";

if (isNative) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

const SNOOZE_MINUTES = 10;
const CATEGORY_ID = "medication_reminder";

export const setupCategory = async () => {
  if (!isNative) return;
  try {
    await Notifications.setNotificationCategoryAsync(CATEGORY_ID, [
      {
        identifier: "snooze",
        buttonTitle: "Remind me later",
        options: {
          opensAppToForeground: true,
        },
      },
    ]);
  } catch (e) {
    console.warn("[Notif] setupCategory error:", e);
  }
};

export const hasNotificationPermission = async () => {
  if (!isNative) return false;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === "granted";
  } catch (e) {
    console.warn("[Notif] permission check error:", e);
    return false;
  }
};

export const requestPermissions = async () => {
  if (!isNative) return false;
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      console.warn("[Notif] permission not granted");
      return false;
    }
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Medication Reminders",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#0b6a6a",
      });
    }
    return true;
  } catch (e) {
    console.warn("[Notif] requestPermissions error:", e);
    return false;
  }
};

const parseDoseTime = (time24) => {
  const [h, m] = time24.split(":").map(Number);
  return { hour: h, minute: m };
};

const scheduleForTime = async (med, doseTime24, dayOfWeek) => {
  if (!isNative) return null;
  const { hour, minute } = parseDoseTime(doseTime24);

  const trigger = dayOfWeek !== undefined
    ? { type: "weekday", weekday: dayOfWeek + 1, hour, minute, repeats: true }
    : { type: "daily", hour, minute, repeats: true };

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: med.name || med.trade_name,
      body: `Time for ${med.name || med.trade_name} — ${med.dosage}`,
      sound: true,
      data: {
        medication_id: med.medication_id,
        dosage: med.dosage,
        screen: "MedicationsScreen",
      },
      categoryIdentifier: CATEGORY_ID,
      ...(Platform.OS === "android" ? { channelId: "default" } : {}),
    },
    trigger,
  });

  return id;
};

export const scheduleMedicationReminders = async (medications) => {
  if (!isNative) return [];
  const granted = await requestPermissions();
  if (!granted) return [];

  const ids = [];
  for (const med of medications) {
    if (med.is_active === false) continue;

    if (!med.schedules) continue;
    for (const sched of med.schedules) {
      const id = await scheduleForTime(med, sched.dose_time, sched.day_of_week);
      ids.push(id);
    }
  }

  return ids;
};

export const snoozeNotification = async (notification) => {
  if (!isNative) return null;
  const { content } = notification.request;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: content.title,
      body: `${content.body} (snoozed)`,
      sound: true,
      data: content.data,
      categoryIdentifier: CATEGORY_ID,
      ...(Platform.OS === "android" ? { channelId: "default" } : {}),
    },
    trigger: {
      type: "timeInterval",
      seconds: SNOOZE_MINUTES * 60,
      repeats: false,
    },
  });

  await saveSnoozedId(id);
  return id;
};

const saveSnoozedId = async (id) => {
  try {
    const raw = await AsyncStorage.getItem(SNOOZE_KEY);
    const ids = raw ? JSON.parse(raw) : [];
    ids.push(id);
    await AsyncStorage.setItem(SNOOZE_KEY, JSON.stringify(ids));
  } catch (e) {
    console.warn("[Notif] saveSnoozedId error:", e);
  }
};

const removeSnoozedId = async (id) => {
  try {
    const raw = await AsyncStorage.getItem(SNOOZE_KEY);
    if (!raw) return;
    const ids = JSON.parse(raw).filter((i) => i !== id);
    if (ids.length === 0) {
      await AsyncStorage.removeItem(SNOOZE_KEY);
    } else {
      await AsyncStorage.setItem(SNOOZE_KEY, JSON.stringify(ids));
    }
  } catch (e) {
    console.warn("[Notif] removeSnoozedId error:", e);
  }
};

const getSnoozedIds = async () => {
  try {
    const raw = await AsyncStorage.getItem(SNOOZE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const cancelAllReminders = async () => {
  if (!isNative) return;
  const snoozedIds = await getSnoozedIds();
  const all = await Notifications.getAllScheduledNotificationsAsync();

  for (const n of all) {
    if (!snoozedIds.includes(n.identifier)) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
};

export const restoreSnoozedNotifications = async () => {
  if (!isNative) return;
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    const scheduledIds = new Set(all.map((n) => n.identifier));
    const snoozedIds = await getSnoozedIds();

    for (const id of snoozedIds) {
      if (!scheduledIds.has(id)) {
        await Notifications.cancelScheduledNotificationAsync(id);
        await removeSnoozedId(id);
      }
    }
  } catch (e) {
    console.warn("[Notif] restoreSnoozedNotifications error:", e);
  }
};

export const syncRemindersFromStorage = async (getMedications) => {
  if (!isNative) return;
  try {
    const stored = await getMedications();
    await cancelAllReminders();
    if (stored.length > 0) {
      await scheduleMedicationReminders(stored);
    }
  } catch (e) {
    console.warn("[Notif] syncRemindersFromStorage error:", e);
  }
};

export const getAllScheduledNotifications = async () => {
  if (!isNative) return [];
  return await Notifications.getAllScheduledNotificationsAsync();
};
