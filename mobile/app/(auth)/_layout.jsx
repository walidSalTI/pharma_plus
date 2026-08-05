import { Stack, useRouter } from "expo-router";
import { Text, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useAppTheme } from "@/src/theme/ThemeContext";

export default function AuthLayout() {
  const router = useRouter();
  const { language, toggleLanguage } = useLanguage();
  const { theme } = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "transparent" },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="LoginScreen"
        options={{
          headerShown: true,
          headerShadowVisible: false,
          headerTransparent: true,
          headerTitle: "",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.replace("/")}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={theme.onSurface} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={toggleLanguage}
              style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: "rgba(11,106,106,0.08)" }}
            >
              <MaterialCommunityIcons name="translate" size={18} color="#0b6a6a" />
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#0b6a6a" }}>
                {language === "ar" ? "AR" : "EN"}
              </Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="RegisterScreen"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ForgotPasswordScreen"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EmailVerifyScreen"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
