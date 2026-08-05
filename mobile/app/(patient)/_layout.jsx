import { Stack } from "expo-router";

export default function PatientLayout() {
  return (
    <Stack>
      <Stack.Screen name="MedicationsScreen" options={{ headerShown: false }} />
      <Stack.Screen name="MedicalFileScreen" options={{ headerShown: false }} />
      <Stack.Screen name="BrowseMedications" options={{ headerShown: false }} />
      <Stack.Screen name="MedicationRequest" options={{ headerShown: false }} />
      <Stack.Screen name="PharmacyDetails" options={{ headerShown: false }} />
      <Stack.Screen name="AddMedication" options={{ presentation: "modal", headerShown: false }} />
    </Stack>
  );
}
