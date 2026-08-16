import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getProfile } from "@/services/profileService";
import { getUserName } from "@/services/tokenService";
import { useAppTheme } from "@/src/theme/ThemeContext";

let profilePromise = null;
const getProfileOnce = () => {
  if (!profilePromise) {
    profilePromise = getProfile().catch(() => null);
  }
  return profilePromise;
};

export default function UserAvatar({ size = 36, onPress }) {
  const { theme } = useAppTheme();
  const [initials, setInitials] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let first = "";
      let last = "";
      try {
        const data = await getProfileOnce();
        if (cancelled) return;
        first = data?.f_name || data?.first_name || "";
        last = data?.l_name || data?.last_name || "";
      } catch {
        first = "";
      }
      let value = `${first[0] || ""}${last[0] || ""}`;
      if (!value) {
        const stored = await getUserName().catch(() => "");
        value = stored ? stored.charAt(0) : "";
      }
      if (!cancelled) setInitials(value.toUpperCase());
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const circleStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.primaryContainer,
  };

  const inner = initials ? (
    <Text style={{ fontSize: size * 0.38, fontWeight: "700", color: theme.primary }}>
      {initials}
    </Text>
  ) : (
    <MaterialCommunityIcons name="account" size={size * 0.55} color={theme.primary} />
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} style={circleStyle}>
        {inner}
      </TouchableOpacity>
    );
  }
  return <View style={circleStyle}>{inner}</View>;
}
