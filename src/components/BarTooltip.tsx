import { BAR_CHART } from "@/constants/stats";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { formatMoney } from "@/lib/money";
import { durations, springs } from "@/theme/motion";
import { useTheme } from "@/theme/ThemeProvider";
import {
  fontFamily,
  opacity,
  radii,
  spacing,
  tabularNums,
  typography,
} from "@/theme/tokens";
import { useEffect, useMemo } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

interface BarTooltipProps {
  left: number;
  top: number;
  amountCents: number;
  label: string;
}

const styles = StyleSheet.create({
  tooltip: {
    position: "absolute",
    width: BAR_CHART.tooltipWidth,
    minHeight: BAR_CHART.tooltipHeight,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.input,
  },
  amount: {
    ...typography.body,
    ...tabularNums,
    fontFamily: fontFamily.semibold,
  },
  label: {
    ...typography.caption,
    ...tabularNums,
    marginTop: spacing.xs,
  },
});

export function BarTooltip({ left, top, amountCents, label }: BarTooltipProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotionSafe();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = reduceMotion
      ? withTiming(1, { duration: durations.reduced })
      : withSpring(1, springs.bouncy);

    return () => cancelAnimation(progress);
  }, [progress, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: reduceMotion ? 1 : progress.value }],
  }));
  const tooltipStyle = useMemo(
    () => [
      styles.tooltip,
      {
        left,
        top,
        backgroundColor: colors.text,
      },
    ],
    [colors.text, left, top],
  );
  const amountStyle = useMemo(
    () => [styles.amount, { color: colors.bg }],
    [colors.bg],
  );
  const labelStyle = useMemo(
    () => [styles.label, { color: colors.bg, opacity: opacity.glass }],
    [colors.bg],
  );

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      style={[tooltipStyle, animatedStyle]}
    >
      <Text numberOfLines={1} adjustsFontSizeToFit style={amountStyle}>
        {formatMoney(amountCents)}
      </Text>
      <Text numberOfLines={1} style={labelStyle}>
        {label}
      </Text>
    </Animated.View>
  );
}
