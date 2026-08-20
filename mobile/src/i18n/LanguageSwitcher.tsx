import { TouchableOpacity, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLanguage } from "./LanguageContext";
import { useResponsive } from "@/constants/responsive";

export default function LanguageSwitcher() {
  const { language, toggleLanguage } = useLanguage();
  const { hs, vs, fontScale } = useResponsive();

  return (
    <TouchableOpacity
      onPress={toggleLanguage}
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: vs(6),
        paddingHorizontal: hs(12),
        borderRadius: hs(20),
        backgroundColor: "rgba(75, 186, 186, 0.12)",
        gap: vs(6),
      }}
    >
      <MaterialCommunityIcons
        name="earth"
        size={hs(16)}
        color="#4bbaba"
      />
      <Text style={{ fontSize: fontScale(13), fontWeight: "600", color: "#4bbaba" }}>
        {language === "en" ? "AR" : "EN"}
      </Text>
    </TouchableOpacity>
  );
}
