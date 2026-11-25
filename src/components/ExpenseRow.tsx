import { CategoryIcon } from "@/components/CategoryIcon";
import { CATEGORY_BY_ID } from "@/constants/categories";
import { AMOUNT_INPUT } from "@/constants/expenseForm";
import { EXPENSE_ROW } from "@/constants/expenses";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { dayLabel } from "@/lib/dates";
import {
    measureExpenseRowTransition,
    rememberExpenseTransition,
} from "@/lib/expenseTransition";
import { lightImpact } from "@/lib/haptics";
import { formatMoney, formatMoneySpoken } from "@/lib/money";
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
import { memo, useCallback, useMemo, useRef, type ComponentRef } from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    View,
    type AccessibilityActionEvent,
} from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";

interface ExpenseRowProps {
  expense: Expense;
  onPress: (expense: Expense) => void;
  onAccessibilityDelete?: () => void;
  contained?: boolean;
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
  containedCard: {
    borderWidth: 0,
    marginBottom: 0,
    paddingHorizontal: 0,
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
    flexShrink: 1,
    textAlign: "right",
  },
});

export const ExpenseRow = memo(function ExpenseRow({
  expense,
  onPress,
  onAccessibilityDelete,
  contained = false,
}: ExpenseRowProps) {
  const { colors, isDark } = useTheme();
  const reduceMotion = useReducedMotionSafe();
  const pressScale = useSharedValue(1);
  const rowRef = useRef<ComponentRef<typeof Animated.View> | null>(null);
  const iconRef = useRef<ComponentRef<typeof View> | null>(null);
  const amountRef = useRef<ComponentRef<typeof View> | null>(null);
  const category = CATEGORY_BY_ID[expense.categoryId];
  const note = expense.note.trim() || category.label;
  const expenseDate = new Date(expense.date);
  const time = format(expenseDate, "h:mm a");
  const dateLabel = dayLabel(expenseDate);
  const amount = formatMoney(expense.amountCents);
  const accessibilityLabel = `${note}, ${category.label}, ${formatMoneySpoken(expense.amountCents)}, ${dateLabel.toLocaleLowerCase()}`;

  const handlePressIn = useCallback(() => {
    pressScale.value = reduceMotion
      ? 1
      : withSpring(EXPENSE_ROW.pressedScale, springs.snappy);
  }, [pressScale, reduceMotion]);

  const handlePressOut = useCallback(() => {
    pressScale.value = reduceMotion ? 1 : withSpring(1, springs.snappy);
  }, [pressScale, reduceMotion]);

  const handlePress = useCallback(() => {
    void lightImpact();
    if (reduceMotion) {
      onPress(expense);
      return;
    }

    void measureExpenseRowTransition(
      rowRef.current,
      iconRef.current,
      amountRef.current,
    )
      .then((origin) => {
        if (origin) {
          rememberExpenseTransition(expense.id, origin);
        }
        onPress(expense);
      })
      .catch(() => onPress(expense));
  }, [expense, onPress, reduceMotion]);
  const handleAccessibilityAction = useCallback(
    (event: AccessibilityActionEvent) => {
      if (event.nativeEvent.actionName === "delete") {
        onAccessibilityDelete?.();
      }
    },
    [onAccessibilityDelete],
  );

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));
  const cardStyle = useMemo(
    () => [
      styles.card,
      contained && styles.containedCard,
      {
        backgroundColor: colors.surface,
        borderColor: colors.border,
      },
      !contained && !isDark ? lightCardShadow : null,
    ],
    [colors.border, colors.surface, contained, isDark],
  );
  const noteStyle = useMemo(
    () => [styles.note, { color: colors.text }],
    [colors.text],
  );
  const captionStyle = useMemo(
    () => [styles.caption, { color: colors.mutedText }],
    [colors.mutedText],
  );
  const amountStyle = useMemo(
    () => [styles.amount, { color: colors.text }],
    [colors.text],
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Opens expense details"
      accessibilityActions={
        onAccessibilityDelete
          ? [{ name: "delete", label: "Delete" }]
          : undefined
      }
      onAccessibilityAction={
        onAccessibilityDelete ? handleAccessibilityAction : undefined
      }
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.pressable}
    >
      <Animated.View ref={rowRef} style={[cardStyle, scaleStyle]}>
        <View ref={iconRef}>
          <CategoryIcon categoryId={expense.categoryId} />
        </View>
        <View style={styles.details}>
          <Text style={noteStyle} numberOfLines={1}>
            {note}
          </Text>
          <Text style={captionStyle} numberOfLines={1}>
            {category.label} · {time}
          </Text>
        </View>
        <Text
          ref={amountRef}
          style={amountStyle}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={AMOUNT_INPUT.minimumFontScale}
        >
          {amount}
        </Text>
      </Animated.View>
    </Pressable>
  );
});
