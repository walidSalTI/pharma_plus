import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

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

const SNOOZE_MINUTES = 30;
const CATEGORY_ID = "medication_reminder";

export const setupCategory = async () => {
  if (!isNative) return;
  try {
    await Notifications.setNotificationCategoryAsync(CATEGORY_ID, [
      {
        identifier: "snooze",
        buttonTitle: "Remind me later",
        options: {
          opensAppToForeground: false,
        },
      },
    ]);
  } catch (e) {
    console.warn("[Notif] setupCategory error:", e);
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
  const fireDate = new Date(Date.now() + SNOOZE_MINUTES * 60 * 1000);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: content.title,
      body: `${content.body} (snoozed)`,
      data: content.data,
      categoryIdentifier: CATEGORY_ID,
      ...(Platform.OS === "android" ? { channelId: "default" } : {}),
    },
    trigger: {
      type: "date",
      date: fireDate,
    },
  });

  return id;
};

export const cancelAllReminders = async () => {
  if (!isNative) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
};

export const getAllScheduledNotifications = async () => {
  if (!isNative) return [];
  return await Notifications.getAllScheduledNotificationsAsync();
};
