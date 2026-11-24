import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { useExpenseStore } from "@/store/useExpenseStore";
import { StatusBar } from "expo-status-bar";
import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    type ReactNode,
} from "react";
import { useColorScheme } from "react-native";
import Animated, {
    interpolateColor,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withTiming,
    type SharedValue,
} from "react-native-reanimated";
import { durations, easing } from "./motion";
import { darkColors, lightColors, type ThemeColors } from "./tokens";

export type ThemeMode = "system" | "light" | "dark";

interface ThemeValue {
  colors: ThemeColors;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

interface ThemeContextValue extends ThemeValue {
  animatedColors: SharedValue<ThemeColors>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useExpenseStore((state) => state.themeMode);
  const setMode = useExpenseStore((state) => state.setThemeMode);
  const systemScheme = useColorScheme();
  const reduceMotion = useReducedMotionSafe();
  const isDark =
    mode === "dark" || (mode === "system" && systemScheme === "dark");
  const colors = isDark ? darkColors : lightColors;
  const themeProgress = useSharedValue(isDark ? 1 : 0);

  useEffect(() => {
    themeProgress.value = withTiming(isDark ? 1 : 0, {
      duration: reduceMotion ? 0 : durations.theme,
      easing: easing.standard,
    });
  }, [isDark, reduceMotion, themeProgress]);

  const animatedColors = useDerivedValue<ThemeColors>(() => ({
    bg: interpolateColor(
      themeProgress.value,
      [0, 1],
      [lightColors.bg, darkColors.bg],
    ),
    surface: interpolateColor(
      themeProgress.value,
      [0, 1],
      [lightColors.surface, darkColors.surface],
    ),
    surfaceAlt: interpolateColor(
      themeProgress.value,
      [0, 1],
      [lightColors.surfaceAlt, darkColors.surfaceAlt],
    ),
    border: interpolateColor(
      themeProgress.value,
      [0, 1],
      [lightColors.border, darkColors.border],
    ),
    text: interpolateColor(
      themeProgress.value,
      [0, 1],
      [lightColors.text, darkColors.text],
    ),
    textMuted: interpolateColor(
      themeProgress.value,
      [0, 1],
      [lightColors.textMuted, darkColors.textMuted],
    ),
    accent: interpolateColor(
      themeProgress.value,
      [0, 1],
      [lightColors.accent, darkColors.accent],
    ),
    accentAlt: interpolateColor(
      themeProgress.value,
      [0, 1],
      [lightColors.accentAlt, darkColors.accentAlt],
    ),
    onAccent: interpolateColor(
      themeProgress.value,
      [0, 1],
      [lightColors.onAccent, darkColors.onAccent],
    ),
    success: interpolateColor(
      themeProgress.value,
      [0, 1],
      [lightColors.success, darkColors.success],
    ),
    warning: interpolateColor(
      themeProgress.value,
      [0, 1],
      [lightColors.warning, darkColors.warning],
    ),
    danger: interpolateColor(
      themeProgress.value,
      [0, 1],
      [lightColors.danger, darkColors.danger],
    ),
  }));

  const rootStyle = useAnimatedStyle(() => ({
    backgroundColor: animatedColors.value.bg,
  }));

  const value = useMemo<ThemeContextValue>(
    () => ({ colors, isDark, mode, setMode, animatedColors }),
    [animatedColors, colors, isDark, mode, setMode],
  );

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Animated.View style={[{ flex: 1 }, rootStyle]}>{children}</Animated.View>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  const { colors, isDark, mode, setMode } = context;
  return { colors, isDark, mode, setMode };
}

export function useAnimatedThemeColors(): SharedValue<ThemeColors> {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useAnimatedThemeColors must be used within ThemeProvider");
  }
  return context.animatedColors;
}
