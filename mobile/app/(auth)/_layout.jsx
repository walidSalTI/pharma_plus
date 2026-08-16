import { Stack, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppTheme } from "@/src/theme/ThemeContext";
import AuthControls from "@/components/AuthControls";

export default function AuthLayout() {
  const router = useRouter();
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
          headerRight: () => <AuthControls />,
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
