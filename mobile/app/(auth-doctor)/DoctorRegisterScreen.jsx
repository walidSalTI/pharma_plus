import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import tw from "twrnc";
import { CustomSelect, InputField } from "@/components/FormInputs";
import LocationPickerModal from "@/components/LocationPickerModal";
import { useDoctorRegisterForm } from "@/hooks/useDoctorRegisterForm";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useResponsive } from "@/constants/responsive";

export default function DoctorRegisterScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const { hs, vs, fontScale, isTablet } = useResponsive();
  const {
    currentStep,
    loading,
    form,
    updateField,
    syndicateImage,
    setSyndicateImage,
    workplaces,
    currentWorkplace,
    updateWorkplaceField,
    addWorkplace,
    removeWorkplace,
    setWorkplaceLocation,
    showLocationPicker,
    setShowLocationPicker,
    locationLoading,
    genderModal,
    setGenderModal,
    specializationModal,
    setSpecializationModal,
    workplaceTypeModal,
    setWorkplaceTypeModal,
    errors,
    nextStep,
    prevStep,
    submitRegistration,
    SPECIALIZATIONS,
    WORKPLACE_TYPES,
  } = useDoctorRegisterForm();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={[tw`flex-1`, { backgroundColor: theme.surface }]}>
        <View style={{ paddingHorizontal: hs(24), paddingTop: vs(12) }}>
          <TouchableOpacity
            onPress={() => (currentStep === 1 ? router.back() : prevStep())}
            style={{ flexDirection: "row", alignItems: "center", marginBottom: vs(8), padding: hs(6), marginHorizontal: -hs(6) }}
          >
            <MaterialCommunityIcons name="arrow-left" size={hs(22)} color={theme.primary} />
            <Text style={[{ fontSize: fontScale(18), marginLeft: hs(8) }, { color: theme.onSurfaceVariant }]}>
              {t("back")}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: hs(24), alignItems: "center", marginBottom: vs(8) }}>
          <View
            style={{
              width: hs(44),
              height: hs(44),
              borderRadius: hs(22),
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: theme.primary,
            }}
          >
            <MaterialCommunityIcons name="stethoscope" size={hs(24)} color="white" />
          </View>
          <Text style={[{ fontSize: fontScale(24), fontWeight: "700", marginTop: vs(12) }, { color: theme.onSurface }]}>
            {t("doctorRegistration")}
          </Text>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: hs(8), marginVertical: vs(16) }}>
          {[1, 2, 3].map((step) => (
            <View key={step} style={{ flexDirection: "row", alignItems: "center", gap: hs(8) }}>
              <View
                style={{
                  width: hs(32),
                  height: hs(32),
                  borderRadius: hs(16),
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: currentStep >= step ? theme.primary : theme.surfaceContainerHigh,
                }}
              >
                {currentStep > step ? (
                  <MaterialCommunityIcons name="check" size={hs(18)} color="white" />
                ) : (
                  <Text style={{ fontSize: fontScale(14), fontWeight: "700", color: currentStep >= step ? "white" : theme.onSurfaceVariant }}>
                    {step}
                  </Text>
                )}
              </View>
              {step < 3 && (
                <View style={{ width: hs(40), height: 2, backgroundColor: currentStep > step ? theme.primary : theme.surfaceContainerHigh }} />
              )}
            </View>
          ))}
        </View>

        <Text style={{ textAlign: "center", fontSize: fontScale(12), fontWeight: "600", color: theme.onSurfaceVariant, marginBottom: vs(8) }}>
          {t(`step${currentStep}of3`)}
        </Text>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: isTablet ? hs(120) : hs(24), paddingBottom: vs(40) }}
        >
          {currentStep === 1 && (
            <StepPersonalInfo form={form} updateField={updateField} errors={errors} locationLoading={locationLoading} genderModal={genderModal} setGenderModal={setGenderModal} specializationModal={specializationModal} setSpecializationModal={setSpecializationModal} SPECIALIZATIONS={SPECIALIZATIONS} theme={theme} hs={hs} vs={vs} fontScale={fontScale} t={t} />
          )}
          {currentStep === 2 && (
            <StepCredentials syndicateImage={syndicateImage} setSyndicateImage={setSyndicateImage} theme={theme} hs={hs} vs={vs} fontScale={fontScale} t={t} />
          )}
          {currentStep === 3 && (
            <StepWorkplaces workplaces={workplaces} currentWorkplace={currentWorkplace} updateWorkplaceField={updateWorkplaceField} addWorkplace={addWorkplace} removeWorkplace={removeWorkplace} showLocationPicker={showLocationPicker} setShowLocationPicker={setShowLocationPicker} workplaceTypeModal={workplaceTypeModal} setWorkplaceTypeModal={setWorkplaceTypeModal} WORKPLACE_TYPES={WORKPLACE_TYPES} theme={theme} hs={hs} vs={vs} fontScale={fontScale} t={t} />
          )}
        </ScrollView>

        <View style={{ paddingHorizontal: hs(24), paddingBottom: vs(32) }}>
          <TouchableOpacity
            onPress={currentStep === 3 ? submitRegistration : nextStep}
            disabled={loading}
            style={{
              height: vs(60),
              borderRadius: hs(28),
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.primary,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ fontSize: fontScale(16), fontWeight: "700", color: "white", marginRight: hs(8) }}>
                  {currentStep === 3 ? t("completeRegistration") : t("next")}
                </Text>
                <MaterialCommunityIcons name="arrow-right" size={hs(20)} color="white" />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace("/(auth-doctor)/DoctorLoginScreen")}
            style={{ marginTop: vs(16), alignItems: "center" }}
          >
            <Text style={[{ fontSize: fontScale(14) }, { color: theme.onSurfaceVariant }]}>
              {t("alreadyHaveAccount")}{" "}
              <Text style={[{ fontSize: fontScale(14), fontWeight: "700" }, { color: theme.primary }]}>
                {t("login")}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      <LocationPickerModal
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onConfirm={(lat, lng) => setWorkplaceLocation(lat, lng)}
        initialLatitude={currentWorkplace.latitude}
        initialLongitude={currentWorkplace.longitude}
      />
    </KeyboardAvoidingView>
  );
}

function StepPersonalInfo({ form, updateField, errors, locationLoading, genderModal, setGenderModal, specializationModal, setSpecializationModal, SPECIALIZATIONS, theme, hs, vs, fontScale, t }) {
  return (
    <View style={{ gap: vs(8) }}>
      <Text style={[{ fontSize: fontScale(10), fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: vs(8) }, { color: theme.onSurfaceVariant }]}>
        {t("personalInfo")}
      </Text>

      <View style={{ flexDirection: "row", gap: hs(12) }}>
        <View style={{ flex: 1 }}>
          <InputField label={t("firstName")} icon="account-outline" placeholder={t("firstNamePlaceholder")} onChangeText={(v) => updateField("f_name", v)} error={errors.f_name} />
        </View>
        <View style={{ flex: 1 }}>
          <InputField label={t("lastName")} icon="account-outline" placeholder={t("lastNamePlaceholder")} onChangeText={(v) => updateField("l_name", v)} error={errors.l_name} />
        </View>
      </View>

      <InputField label={t("email")} icon="email-outline" keyboardType="email-address" placeholder={t("emailPlaceholder")} onChangeText={(v) => updateField("email", v)} error={errors.email} />

      <InputField label={t("password")} icon="lock-outline" secureTextEntry placeholder="********" onChangeText={(v) => updateField("password", v)} error={errors.password} />

      <InputField label={t("confirmPassword")} icon="lock-outline" secureTextEntry placeholder="********" onChangeText={(v) => updateField("password_confirmation", v)} error={errors.password_confirmation} />

      <InputField label={t("phone")} icon="phone-outline" keyboardType="phone-pad" placeholder={t("phonePlaceholder")} onChangeText={(v) => updateField("phone_number", v)} error={errors.phone_number} />

      <InputField label={t("age")} icon="calendar-outline" keyboardType="number-pad" placeholder={t("agePlaceholder")} onChangeText={(v) => updateField("age", v)} error={errors.age} />

      <View style={{ flexDirection: "row", gap: hs(12), zIndex: 100 }}>
        <View style={{ flex: 1, zIndex: 60 }}>
          <CustomSelect label={t("gender")} value={form.gender} placeholder={t("selectPlaceholder")} options={["Male", "Female"]} onSelect={(v) => updateField("gender", v)} visible={genderModal} setVisible={setGenderModal} error={errors.gender} />
        </View>
        <View style={{ flex: 1, zIndex: 50 }}>
          <CustomSelect label={t("specialization")} value={form.specialization} placeholder={t("selectPlaceholder")} options={SPECIALIZATIONS} onSelect={(v) => updateField("specialization", v)} visible={specializationModal} setVisible={setSpecializationModal} error={errors.specialization} />
        </View>
      </View>

      <View>
        <InputField label={t("location")} icon="map-marker-outline" placeholder={t("cityAddress")} value={form.location} onChangeText={(v) => updateField("location", v)} editable={!locationLoading} />
        {locationLoading && (
          <View style={{ position: "absolute", right: hs(16), top: vs(38) }}>
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        )}
      </View>
    </View>
  );
}

function StepCredentials({ syndicateImage, setSyndicateImage, theme, hs, vs, fontScale, t }) {
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      setSyndicateImage(result.assets[0].uri);
    }
  };

  return (
    <View style={{ gap: vs(16) }}>
      <Text style={[{ fontSize: fontScale(10), fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: vs(8) }, { color: theme.onSurfaceVariant }]}>
        {t("credentials")}
      </Text>

      {syndicateImage ? (
        <Image source={{ uri: syndicateImage }} style={{ width: "100%", height: vs(200), borderRadius: hs(16) }} resizeMode="cover" />
      ) : null}

      <TouchableOpacity
        onPress={pickImage}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: hs(8),
          paddingVertical: vs(16),
          borderRadius: hs(12),
          borderWidth: 1.5,
          borderStyle: "dashed",
          borderColor: theme.outlineVariant,
          backgroundColor: theme.surfaceContainerLow,
        }}
      >
        <MaterialCommunityIcons name="image-plus-outline" size={hs(22)} color={theme.primary} />
        <Text style={{ fontSize: fontScale(14), fontWeight: "600", color: theme.primary }}>
          {syndicateImage ? t("changeImage") : t("syndicateCardImage")}
        </Text>
      </TouchableOpacity>

      {syndicateImage && (
        <TouchableOpacity onPress={() => setSyndicateImage(null)} style={{ alignItems: "center" }}>
          <Text style={{ fontSize: fontScale(14), fontWeight: "600", color: theme.error }}>
            {t("removeImage")}
          </Text>
        </TouchableOpacity>
      )}

      <View style={{ flexDirection: "row", alignItems: "center", gap: hs(8), padding: hs(16), borderRadius: hs(12), backgroundColor: theme.surfaceContainerLow }}>
        <MaterialCommunityIcons name="information-outline" size={hs(20)} color={theme.onSurfaceVariant} />
        <Text style={{ fontSize: fontScale(13), color: theme.onSurfaceVariant, flex: 1 }}>
          {t("cardVerificationNote")}
        </Text>
      </View>
    </View>
  );
}

function StepWorkplaces({ workplaces, currentWorkplace, updateWorkplaceField, addWorkplace, removeWorkplace, showLocationPicker, setShowLocationPicker, workplaceTypeModal, setWorkplaceTypeModal, WORKPLACE_TYPES, theme, hs, vs, fontScale, t }) {
  return (
    <View style={{ gap: vs(16) }}>
      <Text style={[{ fontSize: fontScale(10), fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: vs(8) }, { color: theme.onSurfaceVariant }]}>
        {t("workplaceSetup")}
      </Text>

      <View style={{ padding: hs(16), borderRadius: hs(16), backgroundColor: theme.surfaceContainerLow, gap: vs(8) }}>
        <InputField label={t("workplaceName")} icon="office-building-outline" placeholder={t("workplaceNamePlaceholder")} onChangeText={(v) => updateWorkplaceField("place_name", v)} />

        <CustomSelect label={t("workplaceType")} value={currentWorkplace.place_type} placeholder={t("selectPlaceholder")} options={WORKPLACE_TYPES} onSelect={(v) => updateWorkplaceField("place_type", v)} visible={workplaceTypeModal} setVisible={setWorkplaceTypeModal} />

        <TouchableOpacity
          onPress={() => setShowLocationPicker(true)}
          style={{ flexDirection: "row", alignItems: "center", gap: hs(8), paddingVertical: vs(14), paddingHorizontal: hs(16), borderRadius: hs(12), borderWidth: 1, borderColor: theme.outlineVariant, backgroundColor: theme.surfaceContainerLowest }}
        >
          <MaterialCommunityIcons name="map-marker-plus" size={hs(20)} color={theme.primary} />
          <Text style={{ fontSize: fontScale(14), fontWeight: "600", color: currentWorkplace.latitude ? theme.onSurface : theme.onSurfaceVariant }}>
            {currentWorkplace.latitude ? `${t("latitude")}: ${Number(currentWorkplace.latitude).toFixed(4)}, ${t("longitude")}: ${Number(currentWorkplace.longitude).toFixed(4)}` : t("pickLocation")}
          </Text>
        </TouchableOpacity>

        <InputField label={t("geofenceRadius")} icon="radius-outline" placeholder="50" keyboardType="number-pad" value={currentWorkplace.radius_meters} onChangeText={(v) => updateWorkplaceField("radius_meters", v)} />

        <TouchableOpacity
          onPress={addWorkplace}
          style={{ paddingVertical: vs(12), borderRadius: hs(12), alignItems: "center", backgroundColor: theme.primary }}
        >
          <Text style={{ fontSize: fontScale(14), fontWeight: "700", color: "white" }}>{t("addWorkplace")}</Text>
        </TouchableOpacity>
      </View>

      {workplaces.length > 0 && (
        <View style={{ gap: vs(8) }}>
          <Text style={{ fontSize: fontScale(14), fontWeight: "700", color: theme.onSurface }}>{t("addedWorkplaces")}</Text>
          {workplaces.map((wp, index) => (
            <View key={index} style={{ flexDirection: "row", alignItems: "center", padding: hs(16), borderRadius: hs(12), backgroundColor: theme.surfaceContainerLowest, borderWidth: 1, borderColor: theme.outlineVariant, gap: hs(12) }}>
              <MaterialCommunityIcons name={wp.place_type === "Hospital" ? "hospital-box" : wp.place_type === "Clinic" ? "office-building" : "domain"} size={hs(24)} color={theme.primary} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontScale(14), fontWeight: "700", color: theme.onSurface }}>{wp.place_name}</Text>
                <Text style={{ fontSize: fontScale(12), color: theme.onSurfaceVariant }}>{wp.place_type} • {wp.radius_meters}m</Text>
              </View>
              <TouchableOpacity onPress={() => removeWorkplace(index)}>
                <MaterialCommunityIcons name="close" size={hs(20)} color={theme.error} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {workplaces.length === 0 && (
        <View style={{ alignItems: "center", padding: hs(24) }}>
          <MaterialCommunityIcons name="office-building-outline" size={hs(48)} color={theme.outlineVariant} />
          <Text style={{ fontSize: fontScale(14), color: theme.onSurfaceVariant, marginTop: vs(8), textAlign: "center" }}>
            {t("noWorkplacesYet")}
          </Text>
        </View>
      )}
    </View>
  );
}
