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
import {
  LoginEmailInput,
  LoginPasswordInput,
} from "@/components/LoginFormComponents";
import { useLoginForm } from "@/hooks/useLoginForm";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useResponsive } from "@/constants/responsive";

export default function LoginScreen() {
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
  } = useLoginForm();

  const { t, isRTL } = useLanguage();
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
          opacity: 0.2,
          top: vs(-150),
          right: hs(-100),
          backgroundColor: theme.primaryContainer,
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
              backgroundColor: theme.primary,
            }}
          >
            <MaterialCommunityIcons name="pulse" size={hs(28)} color="white" />
          </View>
          <Text
            style={{
              fontSize: fontScale(24),
              fontWeight: "700",
              marginTop: vs(12),
              letterSpacing: -0.5,
              color: theme.primary,
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
          >
            {t("welcomeBack")}
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
            backgroundColor: theme.primary,
          }}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontSize: fontScale(16), fontWeight: "700", color: "white", marginRight: hs(8) }}>
                {t("signIn")}
              </Text>
              <MaterialCommunityIcons
                name={isRTL ? "arrow-left" : "arrow-right"}
                size={hs(18)}
                color="white"
              />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/RegisterScreen")}
          style={{ marginTop: vs(40), alignItems: "center" }}
        >
          <Text style={[{ fontSize: fontScale(14) }, { color: theme.onSurfaceVariant }]}>
            {t("dontHaveAccount")}
            <Text style={[{ fontSize: fontScale(14), fontWeight: "700" }, { color: theme.primary }]}>
              {" "}
              {t("requestAccess")}
            </Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
