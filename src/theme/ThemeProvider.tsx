import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { useExpenseStore } from "@/store/useExpenseStore";
import { StatusBar } from "expo-status-bar";
import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { useColorScheme } from "react-native";
import Animated, {
    interpolateColor,
    runOnJS,
    useAnimatedReaction,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withTiming,
    type SharedValue,
} from "react-native-reanimated";
import { durations, easing, themeSwitchProgress } from "./motion";
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
  const [colors, setColors] = useState<ThemeColors>(() =>
    isDark ? darkColors : lightColors,
  );
  const themeProgress = useSharedValue(isDark ? 1 : 0);

  useEffect(() => {
    themeProgress.value = withTiming(isDark ? 1 : 0, {
      duration: reduceMotion ? 0 : durations.theme,
      easing: easing.standard,
    });
  }, [isDark, reduceMotion, themeProgress]);

  useAnimatedReaction(
    () => {
      "worklet";
      return themeProgress.value;
    },
    (progress, previous) => {
      "worklet";
      if (previous === null) {
        return;
      }

      if (previous < themeSwitchProgress && progress >= themeSwitchProgress) {
        runOnJS(setColors)(darkColors);
      } else if (
        previous >= themeSwitchProgress &&
        progress < themeSwitchProgress
      ) {
        runOnJS(setColors)(lightColors);
      }
    },
  );

  const animatedColors = useDerivedValue<ThemeColors>(() => ({
    bg: interpolateColor(
      themeProgress.value,
      [0, 1],
      [lightColors.bg, darkColors.bg],
    ),
    backdrop: interpolateColor(
      themeProgress.value,
      [0, 1],
      [lightColors.backdrop, darkColors.backdrop],
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
    text:
      themeProgress.value < themeSwitchProgress
        ? lightColors.text
        : darkColors.text,
    textMuted:
      themeProgress.value < themeSwitchProgress
        ? lightColors.textMuted
        : darkColors.textMuted,
    mutedText:
      themeProgress.value < themeSwitchProgress
        ? lightColors.mutedText
        : darkColors.mutedText,
    accent: interpolateColor(
      themeProgress.value,
      [0, 1],
      [lightColors.accent, darkColors.accent],
    ),
    accentText:
      themeProgress.value < themeSwitchProgress
        ? lightColors.accentText
        : darkColors.accentText,
    accentAlt: interpolateColor(
      themeProgress.value,
      [0, 1],
      [lightColors.accentAlt, darkColors.accentAlt],
    ),
    accentDeep: interpolateColor(
      themeProgress.value,
      [0, 1],
      [lightColors.accentDeep, darkColors.accentDeep],
    ),
    onAccent:
      themeProgress.value < themeSwitchProgress
        ? lightColors.onAccent
        : darkColors.onAccent,
    success: interpolateColor(
      themeProgress.value,
      [0, 1],
      [lightColors.success, darkColors.success],
    ),
    successText:
      themeProgress.value < themeSwitchProgress
        ? lightColors.successText
        : darkColors.successText,
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
    dangerText:
      themeProgress.value < themeSwitchProgress
        ? lightColors.dangerText
        : darkColors.dangerText,
    onDanger:
      themeProgress.value < themeSwitchProgress
        ? lightColors.onDanger
        : darkColors.onDanger,
  }));

  const rootStyle = useAnimatedStyle(() => ({
    backgroundColor: animatedColors.value.bg,
  }));

  const displayIsDark = colors === darkColors;
  const value = useMemo<ThemeContextValue>(
    () => ({ colors, isDark: displayIsDark, mode, setMode, animatedColors }),
    [animatedColors, colors, displayIsDark, mode, setMode],
  );

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar style={displayIsDark ? "light" : "dark"} />
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
