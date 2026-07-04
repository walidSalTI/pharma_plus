import { Stack, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function AuthLayout() {
  const router = useRouter();

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
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push("/SettingsScreen")}>
              <MaterialCommunityIcons name="cog-outline" size={24} color="#0b6a6a" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="RegisterScreen"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SettingsScreen"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
