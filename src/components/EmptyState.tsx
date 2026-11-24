import { EMPTY_STATE } from "@/constants/expenses";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
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
import {
    Canvas,
    Circle,
    Group,
    Line,
    RoundedRect,
} from "@shopify/react-native-skia";
import { useEffect, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
    cancelAnimation,
    interpolate,
    useDerivedValue,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";

interface EmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  title: {
    ...typography.headline,
    marginTop: spacing.lg,
    textAlign: "center",
  },
  description: {
    ...typography.body,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  clearButton: {
    minHeight: layout.minTouchTarget,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    marginTop: spacing.base,
    borderRadius: radii.pill,
  },
  clearLabel: {
    ...typography.body,
    fontFamily: fontFamily.semibold,
  },
});

export function EmptyState({ hasFilters, onClearFilters }: EmptyStateProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotionSafe();
  const floatProgress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(floatProgress);
      floatProgress.value = 0;
      return;
    }

    floatProgress.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: durations.slow,
          easing: easing.standard,
        }),
        withTiming(0, {
          duration: durations.slow,
          easing: easing.standard,
        }),
      ),
      -1,
    );

    return () => cancelAnimation(floatProgress);
  }, [floatProgress, reduceMotion]);

  const floatTransform = useDerivedValue(() => [
    {
      translateY: interpolate(
        floatProgress.value,
        [0, 1],
        [-EMPTY_STATE.floatDistance, EMPTY_STATE.floatDistance],
      ),
    },
  ]);
  const canvasStyle = useMemo(
    () => ({
      width: EMPTY_STATE.canvasWidth,
      height: EMPTY_STATE.canvasHeight,
    }),
    [],
  );
  const titleStyle = useMemo(
    () => [styles.title, { color: colors.text }],
    [colors.text],
  );
  const descriptionStyle = useMemo(
    () => [styles.description, { color: colors.textMuted }],
    [colors.textMuted],
  );
  const clearButtonStyle = useMemo(
    () => [styles.clearButton, { backgroundColor: colors.surfaceAlt }],
    [colors.surfaceAlt],
  );
  const clearLabelStyle = useMemo(
    () => [styles.clearLabel, { color: colors.accent }],
    [colors.accent],
  );

  return (
    <View style={styles.container}>
      <Canvas
        style={canvasStyle}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Circle
          cx={EMPTY_STATE.canvasWidth / 2}
          cy={EMPTY_STATE.canvasHeight / 2}
          r={EMPTY_STATE.haloRadius}
          color={colors.accent}
          opacity={opacity.subtle}
        />
        <Group transform={floatTransform}>
          <RoundedRect
            x={EMPTY_STATE.receiptX}
            y={EMPTY_STATE.receiptY}
            width={EMPTY_STATE.receiptWidth}
            height={EMPTY_STATE.receiptHeight}
            r={EMPTY_STATE.receiptRadius}
            color={colors.surfaceAlt}
          />
          <Line
            p1={{
              x: EMPTY_STATE.lineStartX,
              y: EMPTY_STATE.firstLineY,
            }}
            p2={{
              x: EMPTY_STATE.lineEndX,
              y: EMPTY_STATE.firstLineY,
            }}
            color={colors.border}
            strokeWidth={EMPTY_STATE.lineStrokeWidth}
          />
          <Line
            p1={{
              x: EMPTY_STATE.lineStartX,
              y: EMPTY_STATE.secondLineY,
            }}
            p2={{
              x: EMPTY_STATE.lineEndX,
              y: EMPTY_STATE.secondLineY,
            }}
            color={colors.border}
            strokeWidth={EMPTY_STATE.lineStrokeWidth}
          />
          <RoundedRect
            x={EMPTY_STATE.walletX}
            y={EMPTY_STATE.walletY}
            width={EMPTY_STATE.walletWidth}
            height={EMPTY_STATE.walletHeight}
            r={EMPTY_STATE.walletRadius}
            color={colors.accent}
          />
          <RoundedRect
            x={EMPTY_STATE.pocketX}
            y={EMPTY_STATE.pocketY}
            width={EMPTY_STATE.pocketWidth}
            height={EMPTY_STATE.pocketHeight}
            r={EMPTY_STATE.pocketRadius}
            color={colors.accentAlt}
          />
          <Circle
            cx={EMPTY_STATE.claspX}
            cy={EMPTY_STATE.claspY}
            r={EMPTY_STATE.claspRadius}
            color={colors.onAccent}
          />
          <Circle
            cx={EMPTY_STATE.coinX}
            cy={EMPTY_STATE.coinY}
            r={EMPTY_STATE.coinRadius}
            color={colors.warning}
          />
        </Group>
      </Canvas>
      <Text style={titleStyle}>
        {hasFilters ? "No matching expenses" : "No expenses yet"}
      </Text>
      <Text style={descriptionStyle}>
        {hasFilters
          ? "Try a different search or category."
          : "Your expenses will appear here once you add them."}
      </Text>
      {hasFilters ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear filters"
          onPress={onClearFilters}
          style={clearButtonStyle}
        >
          <Text style={clearLabelStyle}>Clear filters</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
