import { useEffect, useRef } from "react";
import { View, ActivityIndicator } from "react-native";
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { LanguageProvider } from "@/src/i18n/LanguageContext";
import { ThemeProvider } from "@/src/theme/ThemeContext";
import { ToastProvider } from "@/src/context/ToastContext";
import { CustomAlertProvider } from "@/src/context/CustomAlertContext";
import { AuthProvider, useAuth } from "@/src/context/AuthContext";
import { getMedications } from "@/services/medicationStorage";
import { scheduleMedicationReminders, setupCategory, cancelAllReminders, snoozeNotification, hasNotificationPermission } from "@/services/notificationService";
import { setupGlobalErrorHandling } from "@/services/errorHandler";
import ErrorBoundary from "@/components/ErrorBoundary";
import tw from "twrnc";

// منع اختفاء شاشة الـ Splash تلقائياً حتى ننتهي من التحقق
SplashScreen.preventAutoHideAsync();

setupGlobalErrorHandling();

const AUTH_GROUPS = ["(auth)", "(auth-doctor)", "(auth-rep)"];

const ROLE_HOME = {
  patient: "/(patient)/MedicationsScreen",
  doctor: "/(doctor)/DoctorDashboard",
  rep: "/(rep)/RepDashboard",
};

export default function RootLayout() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <ToastProvider>
          <CustomAlertProvider>
            <AuthProvider>
              <ErrorBoundary>
                <RootNavigator />
              </ErrorBoundary>
            </AuthProvider>
          </CustomAlertProvider>
        </ToastProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

function RootNavigator() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const { status, role } = useAuth();
  const responseListener = useRef();

  // 1. التنظيم الأولي للمركزات واشتراك استجابات الإشعارات
  useEffect(() => {
    async function prepareApp() {
      try {
        await setupCategory();

        const stored = await getMedications();
        if (stored.length > 0) {
          const granted = await hasNotificationPermission();
          if (granted) {
            await cancelAllReminders();
            await scheduleMedicationReminders(stored);
          }
        }
      } catch (e) {
        console.warn(e);
      }
    }

    prepareApp();

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
        responseListener.current.remove();
      }
    };
  }, []);

  // 2. إخفاء شاشة البدء بعد اكتمال فحص الجلسة
  useEffect(() => {
    if (status !== "loading") {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [status]);

  // 3. حماية وتوجيه المسارات (Auth Guard) حسب الحالة والدور
  useEffect(() => {
    if (status === "loading") return;

    const currentSegment = segments[0];
    const isInAuthGroup = AUTH_GROUPS.includes(currentSegment);
    const isProtectedGroup = Object.keys(ROLE_HOME).some((r) => currentSegment === `(${r})`);

    if (status === "guest") {
      if (isProtectedGroup) {
        router.replace("/");
      }
      return;
    }

    const home = ROLE_HOME[role] || ROLE_HOME.patient;

    if (isInAuthGroup || currentSegment === "index") {
      router.replace(home);
      return;
    }

    if (isProtectedGroup && currentSegment !== `(${role})`) {
      router.replace(home);
    }
  }, [status, role, segments, router]);

  // إرجاع مؤشر تحميل أثناء فحص التوكن لأول مرة
  if (status === "loading") {
    return (
      <View style={tw`flex-1 justify-center items-center bg-white`}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  return (
    <NavThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth-doctor)" options={{ headerShown: false }} />
        <Stack.Screen name="(patient)" options={{ headerShown: false }} />
        <Stack.Screen name="(doctor)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth-rep)" options={{ headerShown: false }} />
        <Stack.Screen name="(rep)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      </Stack>
      <StatusBar style="auto" />
    </NavThemeProvider>
  );
}
