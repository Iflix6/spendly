import type { Category, CategoryId } from "@/constants/categories";
import { CATEGORY_CHIP } from "@/constants/expenses";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { springs } from "@/theme/motion";
import { useAnimatedThemeColors } from "@/theme/ThemeProvider";
import { layout, radii, spacing, typography } from "@/theme/tokens";
import { memo, useCallback, useEffect, useRef } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
} from "react-native-reanimated";

interface CategoryChipProps {
  category: Category | null;
  label: string;
  selected: boolean;
  onPress: (categoryId: CategoryId | null) => void;
}

const styles = StyleSheet.create({
  pressable: {
    minHeight: layout.minTouchTarget,
  },
  chip: {
    height: layout.minTouchTarget,
    minHeight: layout.minTouchTarget,
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
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: layout.indicatorSize,
    height: layout.indicatorSize,
    borderRadius: radii.pill,
    marginRight: spacing.sm,
  },
  label: {
    ...typography.body,
    textAlign: "center",
  },
});

export const CategoryChip = memo(function CategoryChip({
  category,
  label,
  selected,
  onPress,
}: CategoryChipProps) {
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
            withSpring(
              selected ? CATEGORY_CHIP.selectedScale : 1,
              springs.snappy,
            ),
            withSpring(1, springs.snappy),
          );
    }
    wasSelected.current = selected;
  }, [progress, reduceMotion, scale, selected]);

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
      [colors.value.mutedText, colors.value.onAccent],
    ),
  }));
  const chipStyle = useAnimatedStyle(() => ({
    backgroundColor: colors.value.surfaceAlt,
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.value.border, colors.value.accent],
    ),
  }));
  const dotStyle = useAnimatedStyle(() => ({
    backgroundColor: category?.color ?? colors.value.accent,
  }));
  const handlePress = useCallback(() => {
    onPress(category?.id ?? null);
  }, [category?.id, onPress]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={handlePress}
      style={styles.pressable}
    >
      <Animated.View
        style={[styles.chip, chipStyle, scaleStyle]}
        pointerEvents="none"
      >
        <Animated.View style={[styles.fill, fillStyle]} />
        <Animated.View style={styles.labelRow}>
          {category ? <Animated.View style={[styles.dot, dotStyle]} /> : null}
          <Animated.Text style={[styles.label, labelStyle]} numberOfLines={1}>
            {label}
          </Animated.Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
});
