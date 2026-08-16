import { TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useResponsive } from "@/constants/responsive";

export default function SettingsButton() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { hs } = useResponsive();

  return (
    <TouchableOpacity
      onPress={() => router.push("/settings")}
      style={[
        { width: hs(40), height: hs(40), borderRadius: hs(20), alignItems: "center", justifyContent: "center" },
        { backgroundColor: theme.surfaceContainerLow },
      ]}
    >
      <MaterialCommunityIcons name="cog-outline" size={hs(22)} color={theme.primary} />
    </TouchableOpacity>
  );
}
