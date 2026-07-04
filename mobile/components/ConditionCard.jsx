import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import tw from "twrnc";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { webShadow } from "@/constants/shadow";
import { useResponsive } from "@/constants/responsive";

export default function ConditionCard({ name, sub, icon, selected, onPress, showIcon = true }) {
  const { theme } = useAppTheme();
  const { hs, vs, fontScale, isTablet } = useResponsive();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        tw`rounded-2xl justify-between mb-4`,
        {
          width: isTablet ? "31%" : "48%",
          height: vs(128),
          padding: hs(16),
        },
        selected
          ? { backgroundColor: theme.secondaryContainer, borderWidth: 1, borderColor: theme.primary }
          : { backgroundColor: theme.surfaceContainerLowest, ...webShadow({ elevation: 2, opacity: 0.05 }) }
      ]}
    >
      <View style={tw`flex-row justify-between`}>
        {showIcon && <MaterialCommunityIcons name={icon} size={hs(24)} color={selected ? theme.primary : theme.onSurfaceVariant} />}
        {selected && <MaterialCommunityIcons name="check-circle" size={hs(20)} color={theme.primary} />}
      </View>
      <View>
        <Text style={[tw`font-bold leading-tight`, { fontSize: fontScale(16), color: selected ? theme.primary : theme.onSurface }]}>
          {name}
        </Text>
        {sub ? <Text style={[{ fontSize: fontScale(10), opacity: 0.6 }, { color: theme.onSurfaceVariant }]}>{sub}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}
