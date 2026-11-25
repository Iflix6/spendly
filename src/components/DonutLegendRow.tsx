import { CategoryIcon } from "@/components/CategoryIcon";
import { PERCENT_PRECISION } from "@/constants";
import { DONUT_CHART } from "@/constants/stats";
import { CATEGORY_BY_ID, type CategoryId } from "@/constants/categories";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { formatMoney } from "@/lib/money";
import { durations } from "@/theme/motion";
import { useTheme } from "@/theme/ThemeProvider";
import {
  fontFamily,
  layout,
  radii,
  spacing,
  tabularNums,
  typography,
} from "@/theme/tokens";
import { useCallback, useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

interface DonutLegendRowProps {
  categoryId: CategoryId;
  amountCents: number;
  percent: number;
  selected: boolean;
  index: number;
  onPress: () => void;
}

const styles = StyleSheet.create({
  row: {
    minHeight: layout.minTouchTarget + spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.input,
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  label: {
    ...typography.body,
    fontFamily: fontFamily.semibold,
  },
  percent: {
    ...typography.caption,
    ...tabularNums,
  },
  amount: {
    ...typography.body,
    ...tabularNums,
    fontFamily: fontFamily.semibold,
    flexShrink: 0,
  },
});

export function DonutLegendRow({
  categoryId,
  amountCents,
  percent,
  selected,
  index,
  onPress,
}: DonutLegendRowProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotionSafe();
  const category = CATEGORY_BY_ID[categoryId];
  const percentLabel = `${percent.toFixed(PERCENT_PRECISION)}%`;
  const amountLabel = formatMoney(amountCents);
  const entering = reduceMotion
    ? FadeIn.duration(durations.reduced)
    : FadeIn.duration(durations.fast).delay(index * DONUT_CHART.legendStaggerMs);
  const rowStyle = useMemo(
    () => [
      styles.row,
      { backgroundColor: selected ? colors.surfaceAlt : undefined },
    ],
    [colors.surfaceAlt, selected],
  );
  const labelStyle = useMemo(
    () => [styles.label, { color: colors.text }],
    [colors.text],
  );
  const percentStyle = useMemo(
    () => [styles.percent, { color: colors.textMuted }],
    [colors.textMuted],
  );
  const amountStyle = useMemo(
    () => [styles.amount, { color: colors.text }],
    [colors.text],
  );
  const handleTouchStart = useCallback((event: GestureResponderEvent) => {
    event.stopPropagation();
  }, []);

  return (
    <Animated.View entering={entering}>
      <Pressable
        testID={`donut-legend-${categoryId}`}
        accessibilityRole="button"
        accessibilityLabel={`${category.label}, ${amountLabel}, ${percentLabel}${selected ? ", selected" : ""}`}
        accessibilityState={{ selected }}
        onTouchStart={handleTouchStart}
        onPress={onPress}
        style={rowStyle}
      >
        <CategoryIcon categoryId={categoryId} />
        <View style={styles.text} pointerEvents="none">
          <Text numberOfLines={1} style={labelStyle}>
            {category.label}
          </Text>
          <Text numberOfLines={1} style={percentStyle}>
            {percentLabel}
          </Text>
        </View>
        <Text numberOfLines={1} adjustsFontSizeToFit style={amountStyle}>
          {amountLabel}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
