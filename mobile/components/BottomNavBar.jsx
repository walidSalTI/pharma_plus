import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useResponsive } from "@/constants/responsive";

export default function BottomNavBar({ activeTab }) {
  const router = useRouter();
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const { hs, fontScale } = useResponsive();

  const tabs = [
    {
      name: "Meds",
      label: t("meds"),
      icon: "pill",
      route: "/",
    },
    {
      name: "Health",
      label: t("health"),
      icon: "heart-pulse",
      route: "/MedicationRequest",
    },
    {
      name: "Records",
      label: t("records"),
      icon: "clipboard-text",
      route: "/MedicalFileScreen",
    },
    {
      name: "Profile",
      label: t("profile"),
      icon: "account",
      route: "/settings",
    },
  ];

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        paddingHorizontal: hs(12),
        paddingTop: 16,
        paddingBottom: 32,
        backgroundColor: theme.surfaceContainerLowest,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        borderTopWidth: 1,
        borderTopColor: theme.outlineVariant,
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.name;
        return (
          <TouchableOpacity
            key={tab.name}
            onPress={() => {
              router.push(tab.route);
            }}
            style={{
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 16,
              backgroundColor: isActive ? theme.primaryContainer + "40" : "transparent",
            }}
          >
            <MaterialCommunityIcons
              name={tab.icon}
              size={hs(26)}
              color={isActive ? theme.primary : theme.onSurfaceVariant}
            />
            <Text
              style={{
                fontSize: fontScale(10),
                textTransform: "uppercase",
                fontWeight: "700",
                marginTop: 4,
                color: isActive ? theme.primary : theme.onSurfaceVariant,
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
