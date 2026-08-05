import { View } from "react-native";
import RepBottomNavBar from "@/components/RepBottomNavBar";
import SettingsScreen from "@/app/settings";

export default function RepProfileScreen() {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <SettingsScreen />
      </View>
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 50 }}>
        <RepBottomNavBar activeTab="Profile" />
      </View>
    </View>
  );
}
