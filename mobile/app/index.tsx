import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useResponsive } from "@/constants/responsive";

export default function Index() {
  const router = useRouter();
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const { hs, vs, fontScale } = useResponsive();

  const roles = [
    {
      label: t("imPatient"),
      desc: t("patientDesc"),
      icon: "pill",
      route: "/(auth)/LoginScreen",
    },
    {
      label: t("imDoctor"),
      desc: t("doctorDesc"),
      icon: "stethoscope",
      route: "/(auth-doctor)/DoctorLoginScreen",
    },
    {
      label: t("imRepresentative"),
      desc: t("representativeDesc"),
      icon: "briefcase",
      route: "/(auth-rep)/RepLoginScreen",
    },
  ] as const;

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: theme.surface }]}>
      <View
        style={{
          position: "absolute",
          width: hs(400),
          height: hs(400),
          borderRadius: hs(200),
          opacity: 0.2,
          top: vs(-150),
          right: hs(-100),
          backgroundColor: theme.primaryContainer,
        }}
      />

      <View style={[tw`flex-1 justify-center px-6`]}>
        <View style={{ alignItems: "center", marginBottom: vs(48) }}>
          <View
            style={{
              width: hs(56),
              height: hs(56),
              borderRadius: hs(14),
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: theme.primary,
            }}
          >
            <MaterialCommunityIcons name="pulse" size={hs(32)} color="white" />
          </View>
          <Text
            style={{
              fontSize: fontScale(28),
              fontWeight: "800",
              marginTop: vs(12),
              letterSpacing: -0.5,
              color: theme.primary,
            }}
          >
            Pharma Plus
          </Text>
          <Text
            style={{
              fontSize: fontScale(16),
              marginTop: vs(8),
              color: theme.onSurfaceVariant,
            }}
          >
            {t("pleaseSelectPortal")}
          </Text>
        </View>

        <View style={{ gap: vs(16) }}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.label}
              activeOpacity={0.8}
              onPress={() => router.push(role.route)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: hs(20),
                borderRadius: hs(24),
                backgroundColor: theme.surfaceContainerLowest,
                borderWidth: 1,
                borderColor: theme.outlineVariant,
                gap: hs(16),
              }}
            >
              <View
                style={{
                  width: hs(56),
                  height: hs(56),
                  borderRadius: hs(28),
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: theme.primaryContainer,
                }}
              >
                <MaterialCommunityIcons
                  name={role.icon}
                  size={hs(28)}
                  color={theme.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: fontScale(18),
                    fontWeight: "700",
                    color: theme.onSurface,
                  }}
                >
                  {role.label}
                </Text>
                <Text
                  style={{
                    fontSize: fontScale(14),
                    color: theme.onSurfaceVariant,
                    marginTop: 2,
                  }}
                >
                  {role.desc}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={hs(24)}
                color={theme.onSurfaceVariant}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
