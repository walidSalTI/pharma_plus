import { Platform } from "react-native";

export function webShadow({
  elevation = 4,
  color = "#000",
  opacity = 0.3,
  radius = 10,
  offsetY = 6,
} = {}) {
  if (Platform.OS === "web") {
    return {
      boxShadow: `0 ${offsetY}px ${radius}px rgba(0,0,0,${opacity})`,
    };
  }
  return {
    elevation,
    shadowColor: color,
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
  };
}
