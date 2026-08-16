import { TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useResponsive } from "@/constants/responsive";
import LanguageSwitcher from "@/src/i18n/LanguageSwitcher";

export default function AuthControls() {
  const { isDark, toggleTheme } = useAppTheme();
  const { hs } = useResponsive();

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: hs(8) }}>
      <TouchableOpacity
        onPress={toggleTheme}
        activeOpacity={0.7}
        style={{
          width: hs(34),
          height: hs(34),
          borderRadius: hs(17),
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(75, 186, 186, 0.12)",
        }}
      >
        <MaterialCommunityIcons
          name={isDark ? "weather-sunny" : "weather-night"}
          size={hs(18)}
          color="#4bbaba"
        />
      </TouchableOpacity>
      <LanguageSwitcher />
    </View>
  );
}
