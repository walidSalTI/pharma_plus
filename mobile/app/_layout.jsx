import { useEffect, useRef } from "react";
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { LanguageProvider } from "@/src/i18n/LanguageContext";
import { ThemeProvider } from "@/src/theme/ThemeContext";
import { getMedications } from "@/services/medicationStorage";
import { scheduleMedicationReminders, setupCategory, cancelAllReminders, snoozeNotification } from "@/services/notificationService";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const responseListener = useRef();

  useEffect(() => {
    (async () => {
      await setupCategory();

      const stored = await getMedications();
      if (stored.length > 0) {
        await cancelAllReminders();
        await scheduleMedicationReminders(stored);
      }
    })();

    responseListener.current = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const { actionIdentifier, notification } = response;

      if (actionIdentifier === "snooze") {
        await snoozeNotification(notification);
      } else {
        router.push("/(patient)/MedicationsScreen");
      }
    });

    return () => {
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return (
    <LanguageProvider>
      <ThemeProvider>
        <NavThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(patient)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: "modal" }} />
          </Stack>
          <StatusBar style="auto" />
        </NavThemeProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
