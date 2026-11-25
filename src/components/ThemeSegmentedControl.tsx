import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { selection } from "@/lib/haptics";
import { useExpenseStore } from "@/store/useExpenseStore";
import { springs } from "@/theme/motion";
import {
    useAnimatedThemeColors,
    useTheme,
    type ThemeMode,
} from "@/theme/ThemeProvider";
import { fontFamily, layout, radii, spacing, typography } from "@/theme/tokens";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    Pressable,
    StyleSheet,
    type LayoutChangeEvent
} from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";

const THEME_OPTIONS: readonly { mode: ThemeMode; label: string }[] = [
  { mode: "system", label: "System" },
  { mode: "light", label: "Light" },
  { mode: "dark", label: "Dark" },
];

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: spacing.xs,
    borderRadius: radii.input,
    borderWidth: layout.borderWidth,
  },
  thumb: {
    position: "absolute",
    top: spacing.xs,
    bottom: spacing.xs,
    left: spacing.xs,
    borderRadius: radii.input,
  },
  segment: {
    flex: 1,
    minHeight: layout.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  label: {
    ...typography.body,
    fontFamily: fontFamily.semibold,
  },
});

export function ThemeSegmentedControl() {
  const animatedColors = useAnimatedThemeColors();
  const { colors } = useTheme();
  const reduceMotion = useReducedMotionSafe();
  const mode = useExpenseStore((state) => state.themeMode);
  const setThemeMode = useExpenseStore((state) => state.setThemeMode);
  const [segmentWidth, setSegmentWidth] = useState(0);
  const previousWidth = useRef(0);
  const selectedIndex = THEME_OPTIONS.findIndex(
    (option) => option.mode === mode,
  );
  const thumbOffset = useSharedValue(0);

  useEffect(() => {
    if (segmentWidth <= 0) {
      return;
    }

    const target = selectedIndex * segmentWidth;
    thumbOffset.value =
      previousWidth.current === 0 || reduceMotion
        ? target
        : withSpring(target, springs.snappy);
    previousWidth.current = segmentWidth;
  }, [reduceMotion, segmentWidth, selectedIndex, thumbOffset]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const innerWidth = Math.max(
      0,
      event.nativeEvent.layout.width - spacing.xs * 2,
    );
    setSegmentWidth(innerWidth / THEME_OPTIONS.length);
  }, []);
  const handlePress = useCallback(
    (nextMode: ThemeMode) => {
      void selection();
      setThemeMode(nextMode);
    },
    [setThemeMode],
  );
  const containerStyle = useAnimatedStyle(() => ({
    backgroundColor: animatedColors.value.surfaceAlt,
    borderColor: animatedColors.value.border,
  }));
  const thumbStyle = useAnimatedStyle(() => ({
    backgroundColor: animatedColors.value.accent,
    transform: [{ translateX: thumbOffset.value }],
  }));

  return (
    <Animated.View
      accessibilityRole="tablist"
      onLayout={handleLayout}
      style={[styles.container, containerStyle]}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.thumb, { width: segmentWidth }, thumbStyle]}
      />
      {THEME_OPTIONS.map((option) => {
        const selected = option.mode === mode;
        return (
          <Pressable
            key={option.mode}
            accessibilityRole="tab"
            accessibilityLabel={`${option.label} theme`}
            accessibilityState={{ selected }}
            onPress={() => handlePress(option.mode)}
            style={styles.segment}
          >
            <Animated.Text
              numberOfLines={1}
              style={[
                styles.label,
                {
                  color: selected ? colors.onAccent : colors.mutedText,
                },
              ]}
            >
              {option.label}
            </Animated.Text>
          </Pressable>
        );
      })}
    </Animated.View>
  );
}
