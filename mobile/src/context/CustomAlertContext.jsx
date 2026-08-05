import { createContext, useContext, useState, useCallback, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useResponsive } from "@/constants/responsive";

const CustomAlertContext = createContext(null);

const ICONS = {
  info: "information-outline",
  warning: "alert-circle-outline",
  error: "close-circle-outline",
  success: "check-circle-outline",
  delete: "delete-outline",
  logout: "logout",
};

const ICON_COLORS = {
  info: "tertiary",
  warning: "error",
  error: "error",
  success: "primary",
  delete: "error",
  logout: "onSurface",
};

export function CustomAlertProvider({ children }) {
  const [alert, setAlert] = useState(null);
  const alertRef = useRef(null);

  const resolve = useCallback((result) => {
    if (alertRef.current?.onResult) alertRef.current.onResult(result);
    alertRef.current = null;
    setAlert(null);
  }, []);

  const show = useCallback((config) => {
    alertRef.current = config;
    setAlert(config);
  }, []);

  const confirm = useCallback(
    ({ title, message, confirmText, cancelText, variant = "info", icon, onConfirm, onCancel }) => {
      show({
        title,
        message,
        confirmText: confirmText || "Confirm",
        cancelText: cancelText || "Cancel",
        variant,
        icon: icon || ICONS[variant],
        onResult: (confirmed) => {
          if (confirmed && onConfirm) onConfirm();
          if (!confirmed && onCancel) onCancel();
        },
      });
    },
    [show]
  );

  const v = alert ? ICON_COLORS[alert.variant] || "primary" : "primary";

  return (
    <CustomAlertContext.Provider value={{ show, confirm, resolve }}>
      {children}
      <CustomAlertModal alert={alert} onResolve={resolve} colorKey={v} />
    </CustomAlertContext.Provider>
  );
}

function CustomAlertModal({ alert, onResolve, colorKey }) {
  const { theme } = useAppTheme();
  const { hs, vs, fontScale, isTablet } = useResponsive();

  if (!alert) return null;

  const iconBg = theme[colorKey] + "18";

  return (
    <Modal transparent animationType="fade" visible={!!alert}>
      <Pressable
        onPress={() => onResolve(false)}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.4)",
          justifyContent: "center",
          alignItems: "center",
          padding: hs(24),
        }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            width: "100%",
            maxWidth: isTablet ? hs(400) : "100%",
            backgroundColor: theme.surfaceContainerLowest,
            borderRadius: hs(24),
            padding: hs(24),
          }}
        >
          <View style={{ alignItems: "center", marginBottom: vs(16) }}>
            <View
              style={{
                width: hs(56),
                height: hs(56),
                borderRadius: hs(28),
                backgroundColor: iconBg,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: vs(12),
              }}
            >
              <MaterialCommunityIcons
                name={alert.icon || "information-outline"}
                size={hs(28)}
                color={theme[colorKey]}
              />
            </View>
            <Text
              style={{
                fontSize: fontScale(18),
                fontWeight: "700",
                textAlign: "center",
                color: theme.onSurface,
              }}
            >
              {alert.title}
            </Text>
            {alert.message && (
              <Text
                style={{
                  fontSize: fontScale(14),
                  textAlign: "center",
                  color: theme.onSurfaceVariant,
                  marginTop: vs(8),
                  lineHeight: fontScale(20),
                }}
              >
                {alert.message}
              </Text>
            )}
          </View>

          <View style={{ flexDirection: "row", gap: hs(12) }}>
            {alert.cancelText && (
              <TouchableOpacity
                onPress={() => onResolve(false)}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  height: vs(48),
                  borderRadius: hs(14),
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: theme.surfaceContainerLow,
                }}
              >
                <Text
                  style={{
                    fontSize: fontScale(15),
                    fontWeight: "600",
                    color: theme.onSurfaceVariant,
                  }}
                >
                  {alert.cancelText}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => onResolve(true)}
              activeOpacity={0.7}
              style={{
                flex: 1,
                height: vs(48),
                borderRadius: hs(14),
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: alert.variant === "delete" || alert.variant === "error" || alert.variant === "warning"
                  ? theme.error
                  : theme.primary,
              }}
            >
              <Text
                style={{
                  fontSize: fontScale(15),
                  fontWeight: "700",
                  color: "white",
                }}
              >
                {alert.confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function useCustomAlert() {
  const ctx = useContext(CustomAlertContext);
  if (!ctx) throw new Error("useCustomAlert must be used within a CustomAlertProvider");
  return ctx;
}
