import { Stack } from "expo-router";

export default function RepLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RepDashboard" />
      <Stack.Screen name="RepScheduleList" />
      <Stack.Screen name="RepScheduleDetail" />
      <Stack.Screen name="RepQRScanner" />
      <Stack.Screen name="RepVisitHistory" />
      <Stack.Screen name="RepProfileScreen" />
      <Stack.Screen name="TwoFactorSetupScreen" />
    </Stack>
  );
}
