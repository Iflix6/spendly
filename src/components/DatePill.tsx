import { DATE_PILL } from "@/constants/expenseForm";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { springs } from "@/theme/motion";
import { useAnimatedThemeColors } from "@/theme/ThemeProvider";
import { layout, radii, spacing, typography } from "@/theme/tokens";
import { useEffect, useRef } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
} from "react-native-reanimated";

interface DatePillProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

const styles = StyleSheet.create({
  pressable: {
    minHeight: layout.minTouchTarget,
  },
  pill: {
    height: layout.minTouchTarget,
    justifyContent: "center",
    paddingHorizontal: spacing.base,
    borderRadius: radii.pill,
    borderWidth: layout.borderWidth,
    overflow: "hidden",
  },
  fill: {
    ...StyleSheet.absoluteFill,
    borderRadius: radii.pill,
  },
  label: {
    ...typography.body,
    textAlign: "center",
  },
});

export function DatePill({ label, selected, onPress }: DatePillProps) {
  const colors = useAnimatedThemeColors();
  const reduceMotion = useReducedMotionSafe();
  const progress = useSharedValue(selected ? 1 : 0);
  const scale = useSharedValue(1);
  const wasSelected = useRef(selected);

  useEffect(() => {
    progress.value = reduceMotion
      ? selected
        ? 1
        : 0
      : withSpring(selected ? 1 : 0, springs.snappy);

    if (wasSelected.current !== selected) {
      scale.value = reduceMotion
        ? 1
        : withSequence(
            withSpring(selected ? DATE_PILL.selectedScale : 1, springs.snappy),
            withSpring(1, springs.snappy),
          );
    }
    wasSelected.current = selected;
  }, [progress, reduceMotion, scale, selected]);

  const pillStyle = useAnimatedStyle(() => ({
    backgroundColor: colors.value.surfaceAlt,
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.value.border, colors.value.accent],
    ),
  }));
  const fillStyle = useAnimatedStyle(() => ({
    backgroundColor: colors.value.accent,
    opacity: progress.value,
    transform: [{ scaleX: progress.value }],
  }));
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1],
      [colors.value.mutedText, colors.value.onAccent]
    ),
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={styles.pressable}
    >
      <Animated.View style={[styles.pill, pillStyle, scaleStyle]}>
        <Animated.View style={[styles.fill, fillStyle]} />
        <Animated.Text style={[styles.label, labelStyle]} numberOfLines={1}>
          {label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}
