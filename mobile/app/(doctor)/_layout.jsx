import { Stack } from "expo-router";

export default function DoctorLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DoctorDashboard" />
      <Stack.Screen name="DoctorProfileScreen" />
    </Stack>
  );
}
