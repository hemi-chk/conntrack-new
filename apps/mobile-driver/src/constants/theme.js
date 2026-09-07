import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { StatusBar } from "react-native";

export const lightTheme = {
  colors: {
    primary: "#1E40AF",
    secondary: "#3B82F6",
    accent: "#10B981",
    background: "#EFF6FF",
    surface: "#FFFFFF",
    text: "#1E293B",
    textMuted: "#64748B",
    success: "#16A34A",
    warning: "#EA580C",
    error: "#DC2626",
    border: "#E2E8F0",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    fontFamily: {
      regular: "Inter_400Regular",
      medium: "Inter_500Medium",
      semiBold: "Inter_600SemiBold",
      bold: "Inter_700Bold",
    },
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 20,
      xl: 24,
      xxl: 32,
    },
  },
  roundness: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  shadows: {
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 6,
    },
  },
};

export const darkTheme = {
  colors: {
    primary: "#60A5FA",
    secondary: "#93C5FD",
    accent: "#34D399",
    background: "#0F172A",
    surface: "#1E293B",
    text: "#F8FAFC",
    textMuted: "#94A3B8",
    success: "#4ADE80",
    warning: "#FB923C",
    error: "#F87171",
    border: "#334155",
  },
  spacing: { ...lightTheme.spacing },
  typography: { ...lightTheme.typography },
  roundness: { ...lightTheme.roundness },
  shadows: {
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 6,
    },
  },
};

export const theme = { ...lightTheme };

export const applyThemeMode = (isDark) => {
  const nextTheme = isDark ? darkTheme : lightTheme;
  Object.keys(theme).forEach((key) => delete theme[key]);
  Object.assign(theme, { ...nextTheme });
};

const ThemeContext = createContext({
  isDarkMode: false,
  theme: lightTheme,
  setThemeMode: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const bootstrapTheme = async () => {
      try {
        const savedDarkMode = await AsyncStorage.getItem("settings_darkMode");
        if (savedDarkMode !== null) {
          const enabled = savedDarkMode === "true";
          setIsDarkMode(enabled);
          applyThemeMode(enabled);
        }
      } catch (error) {
        console.warn("Could not load saved theme mode:", error);
      }
    };

    bootstrapTheme();
  }, []);

  const setThemeMode = (val) => {
    const boolVal = Boolean(val);
    setIsDarkMode(boolVal);
    applyThemeMode(boolVal);
    AsyncStorage.setItem("settings_darkMode", String(boolVal)).catch(() => {});
  };

  const toggleTheme = () => {
    setThemeMode(!isDarkMode);
  };

  const activeTheme = isDarkMode ? darkTheme : lightTheme;

  const value = useMemo(
    () => ({
      isDarkMode,
      theme: activeTheme,
      setThemeMode,
      toggleTheme,
    }),
    [isDarkMode]
  );

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={activeTheme.colors.background}
      />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

