import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import tw from "twrnc";
import { CustomSelect, InputField } from "@/components/FormInputs";
import { useRegisterForm } from "@/hooks/useRegisterForm";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useResponsive } from "@/constants/responsive";

export default function RegisterScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const { hs, vs, fontScale, isTablet } = useResponsive();
  const {
    loading,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    updateField,
    gender,
    setGender,
    bloodType,
    setBloodType,
    genderModal,
    setGenderModal,
    bloodModal,
    setBloodModal,
    errors,
    handleRegister,
  } = useRegisterForm();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={[tw`flex-1`, { backgroundColor: theme.surface }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[tw`flex-grow justify-center py-16`, { paddingHorizontal: isTablet ? hs(120) : hs(24) }]}
        >
          <View style={{ marginBottom: vs(16) }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <MaterialCommunityIcons name="arrow-left" size={hs(22)} color={theme.primary} />
              <Text style={[{ fontSize: fontScale(18), marginLeft: hs(8) }, { color: theme.onSurfaceVariant }]}>
                {t("back")}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ alignItems: "center", marginBottom: vs(32) }}>
            <View
              style={{
                width: hs(48),
                height: hs(48),
                borderRadius: hs(24),
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: theme.primary,
              }}
            >
              <MaterialCommunityIcons name="pulse" size={hs(28)} color="white" />
            </View>
            <Text style={[{ fontSize: fontScale(30), fontWeight: "700", marginTop: vs(16) }, { color: theme.onSurface }]}>
              {t("createAccount")}
            </Text>
          </View>

          <View style={{ gap: vs(8) }}>
            <View style={{ flexDirection: "row", gap: hs(12) }}>
              <View style={{ flex: 1 }}>
                <InputField
                  label={t("firstName")}
                  icon="account-outline"
                  placeholder={t("firstNamePlaceholder")}
                  onChangeText={(v) => updateField("f_name", v)}
                  error={errors.f_name}
                />
              </View>
              <View style={{ flex: 1 }}>
                <InputField
                  label={t("lastName")}
                  icon="account-outline"
                  placeholder={t("lastNamePlaceholder")}
                  onChangeText={(v) => updateField("l_name", v)}
                  error={errors.l_name}
                />
              </View>
            </View>

            <InputField
              label={t("email")}
              icon="email-outline"
              keyboardType="email-address"
              placeholder={t("emailPlaceholder")}
              onChangeText={(v) => updateField("email", v)}
              error={errors.email}
            />

            <InputField
              label={t("password")}
              icon="lock-outline"
              secureTextEntry={!showPassword}
              placeholder="********"
              onChangeText={(v) => updateField("password", v)}
              error={errors.password}
              rightIcon={showPassword ? "eye-off" : "eye"}
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            <InputField
              label={t("confirmPassword")}
              icon="lock-outline"
              secureTextEntry={!showConfirmPassword}
              placeholder="********"
              onChangeText={(v) => updateField("password_confirmation", v)}
              error={errors.password_confirmation}
              rightIcon={showConfirmPassword ? "eye-off" : "eye"}
              onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
            />

            <InputField
              label={t("phone")}
              icon="phone-outline"
              keyboardType="phone-pad"
              placeholder={t("phonePlaceholder")}
              onChangeText={(v) => updateField("phone_number", v)}
              error={errors.phone_number}
            />

            <InputField
              label={t("age")}
              icon="calendar-outline"
              keyboardType="number-pad"
              placeholder={t("agePlaceholder")}
              onChangeText={(v) => updateField("age", v)}
              error={errors.age}
            />

            <View style={{ flexDirection: "row", gap: hs(12), zIndex: 100 }}>
              <View style={{ flex: 1, zIndex: 60 }}>
                <CustomSelect
                  label={t("gender")}
                  value={gender}
                  placeholder={t("selectPlaceholder")}
                  options={["Male", "Female"]}
                  onSelect={setGender}
                  visible={genderModal}
                  setVisible={setGenderModal}
                />
              </View>
              <View style={{ flex: 1, zIndex: 50 }}>
                <CustomSelect
                  label={t("bloodType")}
                  value={bloodType}
                  placeholder={t("selectPlaceholder")}
                  options={["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]}
                  onSelect={setBloodType}
                  visible={bloodModal}
                  setVisible={setBloodModal}
                />
              </View>
            </View>

            <InputField
              label={t("location")}
              icon="map-marker-outline"
              placeholder={t("cityAddress")}
              onChangeText={(v) => updateField("location", v)}
              error={errors.location}
            />
          </View>

          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            style={{
              marginTop: vs(24),
              height: vs(64),
              borderRadius: hs(32),
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.primary,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ fontSize: fontScale(16), fontWeight: "700", color: "white", marginRight: hs(8) }}>
                  {t("createAccount")}
                </Text>
                <MaterialCommunityIcons name="arrow-right" size={hs(20)} color="white" />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace("/LoginScreen")}
            style={{ marginTop: vs(24), alignItems: "center" }}
          >
            <Text style={[{ fontSize: fontScale(14) }, { color: theme.onSurfaceVariant }]}>
              {t("alreadyHaveAccount")}{" "}
              <Text style={[{ fontSize: fontScale(14), fontWeight: "700" }, { color: theme.primary }]}>
                {t("login")}
              </Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
