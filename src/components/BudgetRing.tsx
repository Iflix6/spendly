import { AMOUNT_INPUT } from "@/constants/expenseForm";
import { BUDGET_RING } from "@/constants/home";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { getBudgetRingState } from "@/lib/budget";
import { formatMoney } from "@/lib/money";
import { durations, easing, springs } from "@/theme/motion";
import { useAnimatedThemeColors, useTheme } from "@/theme/ThemeProvider";
import { spacing, tabularNums, typography } from "@/theme/tokens";
import { Canvas, Circle, Group, Path, Skia } from "@shopify/react-native-skia";
import { useEffect, useMemo, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
    cancelAnimation,
    useDerivedValue,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";

interface BudgetRingProps {
  spentCents: number;
  budgetCents: number;
  size: number;
}

const styles = StyleSheet.create({
  root: {
    position: "relative",
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
  },
  percent: {
    ...typography.headline,
    ...tabularNums,
  },
  detail: {
    ...typography.caption,
    ...tabularNums,
    marginTop: spacing.xs,
    textAlign: "center",
  },
});

export function BudgetRing({ spentCents, budgetCents, size }: BudgetRingProps) {
  const { colors } = useTheme();
  const animatedColors = useAnimatedThemeColors();
  const reduceMotion = useReducedMotionSafe();
  const ringState = useMemo(
    () => getBudgetRingState(spentCents, budgetCents),
    [budgetCents, spentCents],
  );
  const ringSize = Number.isFinite(size)
    ? Math.max(BUDGET_RING.strokeWidth, size)
    : BUDGET_RING.defaultSize;
  const center = ringSize / 2;
  const radius = (ringSize - BUDGET_RING.strokeWidth) / 2;
  const oval = useMemo(
    () => ({
      x: BUDGET_RING.strokeWidth / 2,
      y: BUDGET_RING.strokeWidth / 2,
      width: radius * 2,
      height: radius * 2,
    }),
    [radius],
  );
  const progress = useSharedValue(0);
  const pulse = useSharedValue(1);
  const isInitialProgress = useRef(true);
  const hasPulsed = useRef(false);

  useEffect(() => {
    if (isInitialProgress.current) {
      progress.value = reduceMotion
        ? ringState.visualRatio
        : withTiming(ringState.visualRatio, {
            duration: durations.chart,
            easing: easing.standard,
          });
      isInitialProgress.current = false;
      return;
    }

    progress.value = reduceMotion
      ? ringState.visualRatio
      : withSpring(ringState.visualRatio, springs.soft);
  }, [progress, reduceMotion, ringState.visualRatio]);

  useEffect(() => {
    if (
      hasPulsed.current ||
      ringState.visualRatio < BUDGET_RING.maxVisualRatio
    ) {
      return;
    }

    hasPulsed.current = true;
    if (reduceMotion) {
      pulse.value = 1;
      return;
    }

    pulse.value = withSequence(
      withTiming(BUDGET_RING.pulseScale, {
        duration: durations.fast,
        easing: easing.standard,
      }),
      withSpring(1, springs.soft),
    );
  }, [pulse, reduceMotion, ringState.visualRatio]);

  useEffect(() => {
    return () => {
      cancelAnimation(progress);
      cancelAnimation(pulse);
    };
  }, [progress, pulse]);

  const trackColor = useDerivedValue(() => animatedColors.value.surfaceAlt);
  const progressColor = useDerivedValue(() =>
    ringState.isOverBudget
      ? animatedColors.value.danger
      : animatedColors.value.accent,
  );
  const progressPath = useDerivedValue(() =>
    Skia.PathBuilder.Make()
      .addArc(
        oval,
        BUDGET_RING.startAngleDegrees,
        progress.value * BUDGET_RING.fullCircleDegrees,
      )
      .build(),
  );
  const pulseTransform = useDerivedValue(() => [{ scale: pulse.value }]);
  const canvasStyle = useMemo(
    () => ({ width: ringSize, height: ringSize }),
    [ringSize],
  );
  const detail = ringState.isOverBudget
    ? `over by ${formatMoney(Math.abs(ringState.remainingCents))}`
    : `left: ${formatMoney(ringState.remainingCents)}`;

  return (
    <View style={[styles.root, canvasStyle]} pointerEvents="none">
      <Canvas
        style={canvasStyle}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Circle
          cx={center}
          cy={center}
          r={radius}
          color={trackColor}
          strokeWidth={BUDGET_RING.strokeWidth}
          strokeCap="round"
          style="stroke"
        />
        <Group transform={pulseTransform} origin={{ x: center, y: center }}>
          <Path
            path={progressPath}
            start={0}
            end={1}
            color={progressColor}
            strokeWidth={BUDGET_RING.strokeWidth}
            strokeCap="round"
            style="stroke"
          />
        </Group>
      </Canvas>
      <View style={styles.center} accessible={false}>
        <Text
          accessible={false}
          style={[styles.percent, { color: colors.text }]}
          numberOfLines={1}
        >
          {ringState.percentLabel}
        </Text>
        <Text
          accessible={false}
          style={[
            styles.detail,
            {
              color: ringState.isOverBudget
                ? colors.dangerText
                : colors.mutedText,
            },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={AMOUNT_INPUT.minimumFontScale}
        >
          {detail}
        </Text>
      </View>
    </View>
  );
}
