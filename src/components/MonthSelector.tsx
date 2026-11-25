import { AMOUNT_INPUT } from "@/constants/expenseForm";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { monthlyDateLabel } from "@/lib/stats";
import { durations, easing } from "@/theme/motion";
import { useTheme } from "@/theme/ThemeProvider";
import {
    fontFamily,
    layout,
    opacity,
    radii,
    spacing,
    typography,
} from "@/theme/tokens";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
    FadeIn,
    SlideInLeft,
    SlideInRight,
} from "react-native-reanimated";

interface MonthSelectorProps {
  month: Date;
  direction: -1 | 0 | 1;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  button: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.input,
    borderWidth: layout.borderWidth,
  },
  disabled: {
    opacity: opacity.muted,
  },
  labelContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: layout.minTouchTarget,
    overflow: "hidden",
  },
  label: {
    ...typography.headline,
    fontFamily: fontFamily.semibold,
    textAlign: "center",
  },
});

export function MonthSelector({
  month,
  direction,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
}: MonthSelectorProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotionSafe();
  const label = monthlyDateLabel(month);
  const monthKey = `${month.getFullYear()}-${month.getMonth()}`;
  const labelEntrance = useMemo(() => {
    if (reduceMotion || direction === 0) {
      return FadeIn.duration(reduceMotion ? durations.reduced : durations.base);
    }

    return direction > 0
      ? SlideInRight.duration(durations.base).easing(easing.standard)
      : SlideInLeft.duration(durations.base).easing(easing.standard);
  }, [direction, reduceMotion]);
  const buttonStyle = useMemo(
    () => [
      styles.button,
      {
        backgroundColor: colors.surface,
        borderColor: colors.border,
      },
    ],
    [colors.border, colors.surface],
  );
  const previousStyle = useMemo(
    () => [buttonStyle, !canGoPrevious && styles.disabled],
    [buttonStyle, canGoPrevious],
  );
  const nextStyle = useMemo(
    () => [buttonStyle, !canGoNext && styles.disabled],
    [buttonStyle, canGoNext],
  );
  const labelStyle = useMemo(
    () => [styles.label, { color: colors.text }],
    [colors.text],
  );

  return (
    <View style={styles.container}>
      <Pressable
        testID="month-previous"
        accessibilityRole="button"
        accessibilityLabel="Previous month"
        accessibilityHint="Shows the previous month"
        accessibilityState={{ disabled: !canGoPrevious }}
        disabled={!canGoPrevious}
        onPress={onPrevious}
        style={previousStyle}
      >
        <Ionicons name="chevron-back" size={spacing.xl} color={colors.text} />
      </Pressable>
      <View style={styles.labelContainer}>
        <Animated.View key={monthKey} entering={labelEntrance}>
          <Text
            testID="month-label"
            accessibilityRole="header"
            accessibilityLiveRegion="polite"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={AMOUNT_INPUT.minimumFontScale}
            style={labelStyle}
          >
            {label}
          </Text>
        </Animated.View>
      </View>
      <Pressable
        testID="month-next"
        accessibilityRole="button"
        accessibilityLabel="Next month"
        accessibilityHint="Shows the next month"
        accessibilityState={{ disabled: !canGoNext }}
        disabled={!canGoNext}
        onPress={onNext}
        style={nextStyle}
      >
        <Ionicons
          name="chevron-forward"
          size={spacing.xl}
          color={colors.text}
        />
      </Pressable>
    </View>
  );
}
