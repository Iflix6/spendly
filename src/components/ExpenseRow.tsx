import { CategoryIcon } from "@/components/CategoryIcon";
import { CATEGORY_BY_ID } from "@/constants/categories";
import { EXPENSE_ROW } from "@/constants/expenses";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { formatMoney } from "@/lib/money";
import type { Expense } from "@/store/useExpenseStore";
import { springs } from "@/theme/motion";
import { useTheme } from "@/theme/ThemeProvider";
import {
    fontFamily,
    layout,
    lightCardShadow,
    radii,
    spacing,
    tabularNums,
    typography,
} from "@/theme/tokens";
import { format } from "date-fns";
import { memo, useCallback, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";

interface ExpenseRowProps {
  expense: Expense;
  onPress: (expense: Expense) => void;
}

const styles = StyleSheet.create({
  pressable: {
    minHeight: EXPENSE_ROW.minHeight,
  },
  card: {
    minHeight: EXPENSE_ROW.minHeight,
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.base,
    gap: spacing.md,
    borderRadius: radii.card,
    borderWidth: layout.borderWidth,
    marginBottom: spacing.sm,
  },
  details: {
    flex: 1,
    minWidth: 0,
  },
  note: {
    ...typography.body,
    fontFamily: fontFamily.semibold,
  },
  caption: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  amount: {
    ...typography.body,
    ...tabularNums,
    fontFamily: fontFamily.semibold,
  },
});

export const ExpenseRow = memo(function ExpenseRow({
  expense,
  onPress,
}: ExpenseRowProps) {
  const { colors, isDark } = useTheme();
  const reduceMotion = useReducedMotionSafe();
  const pressScale = useSharedValue(1);
  const category = CATEGORY_BY_ID[expense.categoryId];
  const note = expense.note.trim() || category.label;
  const time = format(new Date(expense.date), "h:mm a");
  const amount = formatMoney(expense.amountCents);

  const handlePressIn = useCallback(() => {
    pressScale.value = reduceMotion
      ? 1
      : withSpring(EXPENSE_ROW.pressedScale, springs.snappy);
  }, [pressScale, reduceMotion]);

  const handlePressOut = useCallback(() => {
    pressScale.value = reduceMotion ? 1 : withSpring(1, springs.snappy);
  }, [pressScale, reduceMotion]);

  const handlePress = useCallback(() => {
    onPress(expense);
  }, [expense, onPress]);

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));
  const cardStyle = useMemo(
    () => [
      styles.card,
      {
        backgroundColor: colors.surface,
        borderColor: isDark ? colors.border : colors.surface,
      },
      isDark ? null : lightCardShadow,
    ],
    [colors.border, colors.surface, isDark],
  );
  const noteStyle = useMemo(
    () => [styles.note, { color: colors.text }],
    [colors.text],
  );
  const captionStyle = useMemo(
    () => [styles.caption, { color: colors.textMuted }],
    [colors.textMuted],
  );
  const amountStyle = useMemo(
    () => [styles.amount, { color: colors.text }],
    [colors.text],
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${note}, ${category.label}, ${amount}`}
      accessibilityHint="Opens expense details"
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.pressable}
    >
      <Animated.View style={[cardStyle, scaleStyle]}>
        <CategoryIcon categoryId={expense.categoryId} />
        <View style={styles.details}>
          <Text style={noteStyle} numberOfLines={1}>
            {note}
          </Text>
          <Text style={captionStyle} numberOfLines={1}>
            {category.label} · {time}
          </Text>
        </View>
        <Text style={amountStyle}>{amount}</Text>
      </Animated.View>
    </Pressable>
  );
});
