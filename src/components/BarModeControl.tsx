import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { selection } from "@/lib/haptics";
import { springs } from "@/theme/motion";
import { useAnimatedThemeColors } from "@/theme/ThemeProvider";
import { fontFamily, layout, radii, spacing, typography } from "@/theme/tokens";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, type LayoutChangeEvent } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";

export type BarMode = "week" | "day";

interface BarModeControlProps {
  mode: BarMode;
  onChange: (mode: BarMode) => void;
}

const OPTIONS: readonly { mode: BarMode; label: string }[] = [
  { mode: "week", label: "Week" },
  { mode: "day", label: "Day" },
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

export function BarModeControl({ mode, onChange }: BarModeControlProps) {
  const animatedColors = useAnimatedThemeColors();
  const reduceMotion = useReducedMotionSafe();
  const [segmentWidth, setSegmentWidth] = useState(0);
  const previousWidth = useRef(0);
  const selectedIndex = mode === "week" ? 0 : 1;
  const thumbOffset = useSharedValue(0);

  useEffect(() => {
    if (segmentWidth <= 0) {
      return;
    }

    const target = selectedIndex * segmentWidth;
    thumbOffset.value =
      reduceMotion || previousWidth.current === 0
        ? target
        : withSpring(target, springs.snappy);
    previousWidth.current = segmentWidth;
  }, [reduceMotion, segmentWidth, selectedIndex, thumbOffset]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const innerWidth = Math.max(
      0,
      event.nativeEvent.layout.width - spacing.xs * 2,
    );
    setSegmentWidth(innerWidth / OPTIONS.length);
  }, []);
  const handlePress = useCallback(
    (nextMode: BarMode) => {
      void selection();
      onChange(nextMode);
    },
    [onChange],
  );
  const containerStyle = useAnimatedStyle(() => ({
    backgroundColor: animatedColors.value.surfaceAlt,
    borderColor: animatedColors.value.border,
  }));
  const thumbStyle = useAnimatedStyle(() => ({
    backgroundColor: animatedColors.value.accent,
    transform: [{ translateX: thumbOffset.value }],
  }));
  const selectedLabelStyle = useAnimatedStyle(() => ({
    color: animatedColors.value.onAccent,
  }));
  const unselectedLabelStyle = useAnimatedStyle(() => ({
    color: animatedColors.value.textMuted,
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
      {OPTIONS.map((option) => {
        const selected = option.mode === mode;
        return (
          <Pressable
            key={option.mode}
            accessibilityRole="tab"
            accessibilityLabel={`${option.label} view`}
            accessibilityState={{ selected }}
            onPress={() => handlePress(option.mode)}
            style={styles.segment}
          >
            <Animated.Text
              numberOfLines={1}
              style={[
                styles.label,
                selected ? selectedLabelStyle : unselectedLabelStyle,
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
