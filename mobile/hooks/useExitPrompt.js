import { useEffect, useState } from "react";
import { BackHandler, Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useResponsive } from "@/constants/responsive";

export const useExitPrompt = () => {
  const isFocused = useIsFocused();
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isFocused) return;

    const handler = () => {
      setVisible(true);
      return true;
    };

    const subscription = BackHandler.addEventListener("hardwareBackPress", handler);
    return () => subscription.remove();
  }, [isFocused]);

  return { exitModal: <ExitModal visible={visible} onClose={() => setVisible(false)} onExit={() => BackHandler.exitApp()} /> };
};

function ExitModal({ visible, onClose, onExit }) {
  const { theme } = useAppTheme();
  const { t } = useLanguage();
  const { hs, vs, fontScale } = useResponsive();

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.4)",
          justifyContent: "center",
          alignItems: "center",
          padding: hs(24),
        }}
      >
        <Pressable onPress={() => {}} style={{ width: "100%", backgroundColor: theme.surfaceContainerLowest, borderRadius: hs(24), padding: hs(28), paddingTop: vs(32), alignItems: "center" }}>
          <View style={{ width: hs(64), height: hs(64), borderRadius: hs(32), backgroundColor: theme.primaryContainer, alignItems: "center", justifyContent: "center", marginBottom: vs(16) }}>
            <MaterialCommunityIcons name="door-open" size={hs(30)} color={theme.primary} />
          </View>
          <Text style={{ fontSize: fontScale(20), fontWeight: "800", color: theme.onSurface, textAlign: "center" }}>
            {t("exitApp")}
          </Text>
          <Text style={{ fontSize: fontScale(14), color: theme.onSurfaceVariant, textAlign: "center", marginTop: vs(8), lineHeight: fontScale(20) }}>
            {t("exitAppConfirm")}
          </Text>
          <View style={{ flexDirection: "row", gap: hs(12), marginTop: vs(28), width: "100%" }}>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              style={{ flex: 1, height: vs(48), borderRadius: hs(14), alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: theme.outline }}
            >
              <Text style={{ fontSize: fontScale(15), fontWeight: "600", color: theme.onSurface }}>{t("no")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onExit}
              activeOpacity={0.7}
              style={{ flex: 1, height: vs(48), borderRadius: hs(14), alignItems: "center", justifyContent: "center", backgroundColor: theme.primary, flexDirection: "row", gap: hs(6) }}
            >
              <MaterialCommunityIcons name="door-open" size={hs(18)} color="white" />
              <Text style={{ fontSize: fontScale(15), fontWeight: "700", color: "white" }}>{t("yes")}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
