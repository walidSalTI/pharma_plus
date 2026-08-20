import { memo } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useResponsive } from "@/constants/responsive";

const TYPE_ICONS = {
  hospital: "hospital-box",
  clinic: "office-building",
};

function WorkplaceCard({ workplace, onEdit, onDelete }) {
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const { hs, vs, fontScale } = useResponsive();

  const icon = TYPE_ICONS[workplace.place_type?.toLowerCase()] || "office-building";

  return (
    <View
      style={{
        padding: hs(16),
        borderRadius: hs(16),
        backgroundColor: theme.surfaceContainerLowest,
        borderWidth: 1,
        borderColor: theme.outlineVariant,
        gap: vs(8),
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: hs(12) }}>
        <View
          style={{
            width: hs(40),
            height: hs(40),
            borderRadius: hs(20),
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: theme.primaryContainer,
          }}
        >
          <MaterialCommunityIcons name={icon} size={hs(20)} color={theme.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: fontScale(16), fontWeight: "700", color: theme.onSurface }}>
            {workplace.place_name}
          </Text>
          <Text style={{ fontSize: fontScale(12), color: theme.onSurfaceVariant, textTransform: "capitalize" }}>
            {workplace.place_type}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: hs(16), paddingLeft: hs(52) }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: hs(4) }}>
          <MaterialCommunityIcons name="crosshairs" size={hs(14)} color={theme.onSurfaceVariant} />
          <Text style={{ fontSize: fontScale(12), color: theme.onSurfaceVariant }}>
            {Number(workplace.latitude).toFixed(4)}, {Number(workplace.longitude).toFixed(4)}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: hs(4) }}>
          <MaterialCommunityIcons name="radius-outline" size={hs(14)} color={theme.onSurfaceVariant} />
          <Text style={{ fontSize: fontScale(12), color: theme.onSurfaceVariant }}>
            {workplace.radius_meters}m
          </Text>
        </View>
      </View>

      {(onEdit || onDelete) && (
        <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: hs(12), paddingLeft: hs(52), marginTop: vs(4) }}>
          {onEdit && (
            <Text onPress={() => onEdit(workplace)} style={{ fontSize: fontScale(13), fontWeight: "600", color: theme.primary }}>
              {t("edit")}
            </Text>
          )}
          {onDelete && (
            <Text onPress={() => onDelete(workplace)} style={{ fontSize: fontScale(13), fontWeight: "600", color: theme.error }}>
              {t("delete")}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

export default memo(WorkplaceCard);
