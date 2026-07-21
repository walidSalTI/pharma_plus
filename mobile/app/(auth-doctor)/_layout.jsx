import { Stack, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function DoctorAuthLayout() {
  const router = useRouter();

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
          headerShown: false,
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
    </Stack>
  );
}
