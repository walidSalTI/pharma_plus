import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useColorScheme } from "react-native";
import { lightTheme, darkTheme } from "@/constants/theme";
import { lightThemeOverride } from "@/constants/themeOverrides";

type Theme = typeof lightTheme;

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setDarkMode: (dark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === "dark");

  useEffect(() => {
    if (systemScheme) {
      setIsDark(systemScheme === "dark");
    }
  }, [systemScheme]);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  const setDarkMode = useCallback((dark: boolean) => {
    setIsDark(dark);
  }, []);

  const theme = isDark ? darkTheme : { ...lightTheme, ...lightThemeOverride };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within a ThemeProvider");
  }
  return context;
}
