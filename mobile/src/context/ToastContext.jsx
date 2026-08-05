import { createContext, useContext, useState, useCallback, useRef } from "react";
import { Animated, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useResponsive } from "@/constants/responsive";

const ToastContext = createContext(null);

const DURATION = 3000;

const VARIANTS = {
  success: { icon: "check-circle", colorKey: "primary" },
  error: { icon: "alert-circle", colorKey: "error" },
  info: { icon: "information", colorKey: "tertiary" },
  warning: { icon: "alert", colorKey: "error" },
};

export function ToastProvider({ children }) {
  const { theme } = useAppTheme();
  const { hs, vs, fontScale } = useResponsive();
  const [toast, setToast] = useState(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef(null);

  const show = useCallback(
    (message, variant = "info") => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      opacity.setValue(0);
      setToast({ message, variant });
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(DURATION),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setToast(null));
    },
    [opacity]
  );

  const success = useCallback((msg) => show(msg, "success"), [show]);
  const error = useCallback((msg) => show(msg, "error"), [show]);
  const info = useCallback((msg) => show(msg, "info"), [show]);
  const warning = useCallback((msg) => show(msg, "warning"), [show]);

  const v = toast ? VARIANTS[toast.variant] || VARIANTS.info : null;
  const iconColor = v ? theme[v.colorKey] : theme.primary;

  return (
    <ToastContext.Provider value={{ show, success, error, info, warning }}>
      {children}
      {toast && (
        <Animated.View
          style={{
            position: "absolute",
            top: vs(56),
            left: hs(16),
            right: hs(16),
            zIndex: 9999,
            opacity,
            flexDirection: "row",
            alignItems: "center",
            gap: hs(12),
            backgroundColor: theme.surfaceContainerLowest,
            borderRadius: hs(16),
            padding: hs(16),
            borderWidth: 1,
            borderColor: theme.outlineVariant,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <View
            style={{
              width: hs(36),
              height: hs(36),
              borderRadius: hs(18),
              backgroundColor: iconColor + "18",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialCommunityIcons name={v.icon} size={hs(20)} color={iconColor} />
          </View>
          <Text
            style={{
              flex: 1,
              fontSize: fontScale(14),
              fontWeight: "600",
              color: theme.onSurface,
            }}
            numberOfLines={2}
          >
            {toast.message}
          </Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
