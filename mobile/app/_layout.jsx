import React, { useEffect, useRef } from "react";
import { View, Text, TextInput, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import "react-native-reanimated";
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withRepeat, withTiming } from "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { LanguageProvider } from "@/src/i18n/LanguageContext";
import { ThemeProvider, useAppTheme } from "@/src/theme/ThemeContext";
import { ToastProvider } from "@/src/context/ToastContext";
import { CustomAlertProvider } from "@/src/context/CustomAlertContext";
import { AuthProvider, useAuth } from "@/src/context/AuthContext";
import { getMedications } from "@/services/medicationStorage";
import { scheduleMedicationReminders, setupCategory, cancelAllReminders, snoozeNotification, restoreSnoozedNotifications, hasNotificationPermission } from "@/services/notificationService";
import { setupGlobalErrorHandling } from "@/services/errorHandler";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useResponsive } from "@/constants/responsive";
import tw from "twrnc";

// Monkey-patching Text to enforce max font scaling at 1.3x
if (Text.prototype && Text.prototype.render) {
  const OldTextRender = Text.prototype.render;
  Text.prototype.render = function (...args) {
    const element = OldTextRender.call(this, ...args);
    return React.cloneElement(element, { ...element.props, maxFontSizeMultiplier: 1.3 });
  };
}

// Monkey-patching TextInput to enforce max font scaling at 1.3x
if (TextInput.prototype && TextInput.prototype.render) {
  const OldTextInputRender = TextInput.prototype.render;
  TextInput.prototype.render = function (...args) {
    const element = OldTextInputRender.call(this, ...args);
    return React.cloneElement(element, { ...element.props, maxFontSizeMultiplier: 1.3 });
  };
}

setupGlobalErrorHandling();

const AUTH_GROUPS = ["(auth)", "(auth-doctor)", "(auth-rep)"];

const ROLE_HOME = {
  patient: "/(patient)/MedicationsScreen",
  doctor: "/(doctor)/DoctorDashboard",
  rep: "/(rep)/RepDashboard",
};

function LoadingScreen() {
  const { hs, vs } = useResponsive();
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1.15, { duration: 800 }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View style={{ flex: 1, backgroundColor: "#0f1724" }}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Animated.Image
          entering={FadeIn.duration(600)}
          source={require("@/assets/images/icon.png")}
          style={[{ width: hs(120), height: hs(120) }, animatedStyle]}
          resizeMode="contain"
        />
      </View>
      <Animated.View
        entering={FadeIn.duration(600).delay(200)}
        style={{ position: "absolute", bottom: vs(80), left: 0, right: 0, alignItems: "center" }}
      >
        <Text
          style={{
            fontSize: hs(24),
            fontWeight: "700",
            color: "#ffffff",
            letterSpacing: 1.5,
          }}
        >
          Pharma Plus
        </Text>
      </Animated.View>
    </View>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.preventAutoHideAsync();
  }, []);

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
  const { theme } = useAppTheme();
  const { hs, vs } = useResponsive();
  const responseListener = useRef();
  const roleRef = useRef(role);
  roleRef.current = role;

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
        await restoreSnoozedNotifications();
      } catch (e) {
        console.warn(e);
      }
    }

    prepareApp();

    responseListener.current = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const { actionIdentifier, notification } = response;

      if (actionIdentifier === "snooze") {
        await snoozeNotification(notification);
      } else if (roleRef.current === "patient") {
        router.push("/(patient)/MedicationsScreen");
      }
    });

    return () => {
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [router]);

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

    const home = ROLE_HOME[role];
    if (!home) {
      router.replace("/");
      return;
    }

    if (isInAuthGroup || currentSegment === "index") {
      router.replace(home);
      return;
    }

    if (isProtectedGroup && currentSegment !== `(${role})`) {
      router.replace(home);
    }
  }, [status, role, segments, router]);

  if (status === "loading") {
    return <LoadingScreen />;
  }

  return (
    <NavThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="terms" options={{ headerShown: false }} />
        <Stack.Screen name="privacy" options={{ headerShown: false }} />
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
