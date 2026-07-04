import { TouchableOpacity, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLanguage } from "./LanguageContext";

export default function LanguageSwitcher() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <TouchableOpacity
      onPress={toggleLanguage}
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: "rgba(75, 186, 186, 0.12)",
        gap: 6,
      }}
    >
      <MaterialCommunityIcons
        name="translate"
        size={16}
        color="#4bbaba"
      />
      <Text style={{ fontSize: 13, fontWeight: "600", color: "#4bbaba" }}>
        {language === "en" ? "AR" : "EN"}
      </Text>
    </TouchableOpacity>
  );
}
