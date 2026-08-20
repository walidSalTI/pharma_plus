import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useResponsive } from "@/constants/responsive";

export default function DoctorBottomNavBar({ activeTab }) {
  const router = useRouter();
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const { hs, vs, fontScale } = useResponsive();
  const insets = useSafeAreaInsets();

  const tabs = [
    {
      name: "Dashboard",
      label: t("dashboard"),
      icon: "qrcode",
      route: "/(doctor)/DoctorDashboard",
    },
    {
      name: "Profile",
      label: t("profile"),
      icon: "account",
      route: "/(doctor)/DoctorProfileScreen",
    },
  ];

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        paddingHorizontal: hs(12),
        paddingTop: vs(8),
        paddingBottom: insets.bottom + 8,
        backgroundColor: theme.surfaceContainerLowest,
        borderTopLeftRadius: hs(30),
        borderTopRightRadius: hs(30),
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
              paddingVertical: vs(8),
              paddingHorizontal: hs(16),
              borderRadius: hs(16),
              backgroundColor: isActive ? theme.primaryContainer + "40" : "transparent",
            }}
          >
            <MaterialCommunityIcons
              name={tab.icon}
              size={hs(22)}
              color={isActive ? theme.primary : theme.onSurfaceVariant}
            />
            <Text
              style={{
                fontSize: fontScale(10),
                textTransform: "uppercase",
                fontWeight: "700",
                marginTop: vs(4),
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
