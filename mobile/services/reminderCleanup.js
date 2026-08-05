import { clearMedications, clearMedsCache } from "./medicationStorage";
import { cancelAllReminders } from "./notificationService";

export const clearAllReminders = async () => {
  await cancelAllReminders();
  await clearMedications();
  await clearMedsCache();
};
