import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc";
import { LinearGradient } from "expo-linear-gradient";
import {
  LoginEmailInput,
  LoginPasswordInput,
} from "@/components/LoginFormComponents";
import { useDoctorLoginForm } from "@/hooks/useDoctorLoginForm";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useResponsive } from "@/constants/responsive";

const AUTH_PRIMARY = "#4bbaba";
const AUTH_PRIMARY_DIM = "#3aa0a0";

export default function DoctorLoginScreen() {
  const router = useRouter();
  const {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    showPassword,
    setShowPassword,
    errors,
    handleLogin,
  } = useDoctorLoginForm();

  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const { hs, vs, fontScale, isTablet } = useResponsive();

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: theme.surface }]}>
      <View
        style={{
          position: "absolute",
          width: hs(400),
          height: hs(400),
          borderRadius: hs(200),
          opacity: 0.15,
          top: vs(-150),
          left: hs(-100),
          backgroundColor: theme.tertiaryContainer,
        }}
      />

      <ScrollView
        contentContainerStyle={[tw`flex-grow justify-center py-12`, { paddingHorizontal: isTablet ? hs(120) : hs(24) }]}
      >
        <View style={{ alignItems: "center", marginBottom: vs(36) }}>
          <View
            style={{
              width: hs(48),
              height: hs(48),
              borderRadius: hs(12),
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: AUTH_PRIMARY,
            }}
          >
            <MaterialCommunityIcons name="stethoscope" size={hs(28)} color="white" />
          </View>
          <Text
            style={{
              fontSize: fontScale(24),
              fontWeight: "700",
              marginTop: vs(12),
              letterSpacing: -0.5,
              color: AUTH_PRIMARY,
            }}
          >
            {t("Pharma")}
          </Text>
        </View>

        <View style={{ marginBottom: vs(28), alignItems: "center" }}>
          <Text
            style={{
              fontSize: fontScale(30),
              fontWeight: "700",
              marginBottom: vs(8),
              letterSpacing: -0.5,
              textAlign: "center",
              color: theme.onSurface,
            }}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
            numberOfLines={1}
          >
            {t("welcomeBack")}
          </Text>
          <Text
            style={{
              fontSize: fontScale(14),
              textAlign: "center",
              color: theme.onSurfaceVariant,
            }}
          >
            {t("doctorLoginSubtitle")}
          </Text>
        </View>

        <View style={{ gap: vs(8) }}>
          <LoginEmailInput email={email} setEmail={setEmail} error={errors.email} />
          <LoginPasswordInput
            password={password}
            setPassword={setPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            error={errors.password}
            onForgot={() => router.push("/(auth)/ForgotPasswordScreen")}
          />
        </View>

        <TouchableOpacity
          onPress={handleLogin}
          activeOpacity={0.8}
          style={{
            marginTop: vs(40),
            height: vs(60),
            borderRadius: hs(28),
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <LinearGradient
            colors={[AUTH_PRIMARY, AUTH_PRIMARY_DIM]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          />
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text numberOfLines={1} style={{ fontSize: fontScale(16), fontWeight: "700", color: "white", marginRight: hs(8) }}>
                {t("signIn")}
              </Text>
              <MaterialCommunityIcons
                name="arrow-right"
                size={hs(18)}
                color="white"
              />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/(auth-doctor)/DoctorRegisterScreen")}
          style={{ marginTop: vs(40), alignItems: "center" }}
        >
          <Text style={[{ fontSize: fontScale(14) }, { color: theme.onSurfaceVariant }]}>
            {t("dontHaveAccount")}
            <Text style={[{ fontSize: fontScale(14), fontWeight: "700" }, { color: AUTH_PRIMARY }]}>
              {" "}
              {t("registerAsDoctor")}
            </Text>
          </Text>
        </TouchableOpacity>


      </ScrollView>
    </SafeAreaView>
  );
}
