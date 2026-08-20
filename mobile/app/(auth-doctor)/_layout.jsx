import { Stack, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useResponsive } from "@/constants/responsive";

export default function DoctorAuthLayout() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { hs } = useResponsive();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "transparent" },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="DoctorLoginScreen"
        options={{
          headerShown: true,
          headerShadowVisible: false,
          headerTransparent: true,
          headerTitle: "",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.replace("/")}>
              <MaterialCommunityIcons name="arrow-left" size={hs(24)} color={theme.onSurface} />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="DoctorRegisterScreen"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TwoFactorVerifyScreen"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EmailVerifyScreen"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
