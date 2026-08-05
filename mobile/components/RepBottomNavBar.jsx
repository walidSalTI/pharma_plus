import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useResponsive } from "@/constants/responsive";

export default function RepBottomNavBar({ activeTab }) {
  const router = useRouter();
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const { hs, fontScale } = useResponsive();

  const tabs = [
    {
      name: "Dashboard",
      label: t("dashboard"),
      icon: "view-dashboard",
      route: "/(rep)/RepDashboard",
    },
    {
      name: "Schedules",
      label: t("schedules"),
      icon: "calendar-clock",
      route: "/(rep)/RepScheduleList",
    },
    {
      name: "History",
      label: t("history"),
      icon: "history",
      route: "/(rep)/RepVisitHistory",
    },
    {
      name: "Profile",
      label: t("profile"),
      icon: "account",
      route: "/(rep)/RepProfileScreen",
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
            onPress={() => router.push(tab.route)}
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
