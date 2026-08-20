import { Component } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useResponsive } from "@/constants/responsive";
import { useAppTheme } from "@/src/theme/ThemeContext";

function ErrorUI({ message, onReset }) {
  const { hs, vs, fontScale } = useResponsive();
  const { theme } = useAppTheme();
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.surface, padding: vs(24) }}>
      <Text style={{ fontSize: fontScale(18), fontWeight: "700", color: theme.onSurface, marginBottom: vs(8) }}>
        Something went wrong
      </Text>
      {message ? (
        <Text style={{ fontSize: fontScale(13), color: theme.onSurfaceVariant, textAlign: "center", marginBottom: vs(24) }}>
          {message}
        </Text>
      ) : null}
      <TouchableOpacity
        style={{ backgroundColor: theme.primary, paddingHorizontal: hs(24), paddingVertical: vs(12), borderRadius: hs(8) }}
        onPress={onReset}
      >
        <Text style={{ color: "white", fontWeight: "600", fontSize: fontScale(15) }}>Try again</Text>
      </TouchableOpacity>
    </View>
  );
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || String(error) };
  }

  componentDidCatch(error) {
    console.error("[ErrorBoundary] Uncaught render error:", error);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: null });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorUI message={this.state.message} onReset={this.handleReset} />;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
