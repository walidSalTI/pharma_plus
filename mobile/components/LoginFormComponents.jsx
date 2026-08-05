import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useResponsive } from "@/constants/responsive";

export const LoginEmailInput = ({ email, setEmail, error }) => {
  const { theme } = useAppTheme();
  const { hs, vs, fontScale } = useResponsive();
  return (
    <View>
      <Text
        style={{
          fontSize: fontScale(10),
          fontWeight: "700",
          textTransform: "uppercase",
          marginBottom: 8,
          marginLeft: 4,
          color: theme.onSurfaceVariant,
          letterSpacing: 1,
        }}
      >
        Email or ID
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderRadius: 12,
          borderWidth: 1,
          paddingHorizontal: hs(16),
          height: vs(56),
          backgroundColor: theme.surfaceContainerLow,
          borderColor: error ? theme.error : theme.outlineVariant,
        }}
      >
        <MaterialCommunityIcons
          name="email-outline"
          size={hs(20)}
          color={theme.onSurfaceVariant}
        />
        <TextInput
          style={{ flex: 1, height: "100%", marginLeft: 12, fontSize: fontScale(16), color: theme.onSurface }}
          placeholder="Enter your email"
          placeholderTextColor={theme.onSurfaceVariant}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
      {error && (
        <Text style={{ fontSize: fontScale(12), marginTop: 4, marginLeft: 4, color: theme.error }}>{error}</Text>
      )}
    </View>
  );
};

export const LoginPasswordInput = ({
  password,
  setPassword,
  showPassword,
  setShowPassword,
  error,
  onForgot,
}) => {
  const { theme } = useAppTheme();
  const { hs, vs, fontScale } = useResponsive();
  return (
    <View style={{ marginTop: 16 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8, marginLeft: 4 }}>
        <Text
          style={{
            fontSize: fontScale(10),
            fontWeight: "700",
            textTransform: "uppercase",
            color: theme.onSurfaceVariant,
            letterSpacing: 1,
          }}
        >
          Password
        </Text>
        <TouchableOpacity onPress={onForgot}>
          <Text
            style={{
              fontSize: fontScale(10),
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: 1,
              color: theme.primary,
            }}
          >
            Forgot?
          </Text>
        </TouchableOpacity>
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderRadius: 12,
          borderWidth: 1,
          paddingHorizontal: hs(16),
          height: vs(56),
          backgroundColor: theme.surfaceContainerLow,
          borderColor: error ? theme.error : theme.outlineVariant,
        }}
      >
        <MaterialCommunityIcons
          name="lock-outline"
          size={hs(20)}
          color={theme.onSurfaceVariant}
        />
        <TextInput
          style={{ flex: 1, height: "100%", marginLeft: 12, fontSize: fontScale(16), color: theme.onSurface }}
          placeholder="Enter your password"
          placeholderTextColor={theme.onSurfaceVariant}
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <MaterialCommunityIcons
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={hs(20)}
            color={theme.onSurfaceVariant}
          />
        </TouchableOpacity>
      </View>
      {error && (
        <Text style={{ fontSize: fontScale(12), marginTop: 4, marginLeft: 4, color: theme.error }}>{error}</Text>
      )}
    </View>
  );
};
