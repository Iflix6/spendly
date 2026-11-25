import { BottomSheet, type BottomSheetHandle } from "@/components/BottomSheet";
import { NumberPad } from "@/components/NumberPad";
import { CURRENCY_SYMBOL, MIN_BUDGET_CENTS } from "@/constants";
import { SAVE_BUTTON } from "@/constants/expenseForm";
import { formatKeypadDisplay, keypadValueFromCents } from "@/lib/expenseForm";
import { success, warning } from "@/lib/haptics";
import { centsFromKeypad, formatMoney } from "@/lib/money";
import { useExpenseStore } from "@/store/useExpenseStore";
import { useTheme } from "@/theme/ThemeProvider";
import {
    fontFamily,
    layout,
    opacity,
    radii,
    spacing,
    tabularNums,
    typography,
} from "@/theme/tokens";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useCallback, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface BudgetSheetProps {
  onDismiss: () => void;
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.base,
    gap: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base,
  },
  title: {
    ...typography.title,
    flex: 1,
  },
  close: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.input,
    borderWidth: layout.borderWidth,
  },
  amountArea: {
    minHeight: typography.display.lineHeight + spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  currency: {
    ...typography.display,
    ...tabularNums,
    marginRight: spacing.xs,
  },
  amount: {
    ...typography.display,
    ...tabularNums,
  },
  hint: {
    ...typography.caption,
    textAlign: "center",
  },
  save: {
    minHeight: SAVE_BUTTON.height,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
  },
  saveLabel: {
    ...typography.body,
    fontFamily: fontFamily.semibold,
  },
});

export function BudgetSheet({ onDismiss }: BudgetSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetHandle>(null);
  const budgetCents = useExpenseStore((state) => state.budgetCents);
  const setBudget = useExpenseStore((state) => state.setBudget);
  const [value, setValue] = useState(() => keypadValueFromCents(budgetCents));
  const amountCents = useMemo(() => centsFromKeypad(value), [value]);
  const canSave = amountCents >= MIN_BUDGET_CENTS;
  const displayValue = formatKeypadDisplay(value || "0");

  const handleDismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);
  const handleClose = useCallback(() => {
    sheetRef.current?.dismiss();
  }, []);
  const handleInvalid = useCallback(() => {
    void warning();
  }, []);
  const handleSave = useCallback(() => {
    if (!canSave) {
      void warning();
      return;
    }

    void success();
    setBudget(amountCents);
    sheetRef.current?.dismiss();
  }, [amountCents, canSave, setBudget]);

  const titleStyle = useMemo(
    () => [styles.title, { color: colors.text }],
    [colors.text],
  );
  const closeStyle = useMemo(
    () => [
      styles.close,
      {
        backgroundColor: colors.surface,
        borderColor: colors.border,
      },
    ],
    [colors.border, colors.surface],
  );
  const currencyStyle = useMemo(
    () => [styles.currency, { color: colors.mutedText }],
    [colors.mutedText],
  );
  const amountStyle = useMemo(
    () => [styles.amount, { color: colors.text }],
    [colors.text],
  );
  const hintStyle = useMemo(
    () => [styles.hint, { color: colors.mutedText }],
    [colors.mutedText],
  );
  const saveStyle = useMemo(
    () => [
      styles.save,
      {
        backgroundColor: colors.accent,
        opacity: canSave ? 1 : opacity.muted,
      },
    ],
    [canSave, colors.accent],
  );
  const saveLabelStyle = useMemo(
    () => [styles.saveLabel, { color: colors.onAccent }],
    [colors.onAccent],
  );
  const contentStyle = useMemo(
    () => [
      styles.content,
      { paddingBottom: Math.max(insets.bottom, spacing.base) },
    ],
    [insets.bottom],
  );

  return (
    <BottomSheet
      ref={sheetRef}
      onDismiss={handleDismiss}
      dismissLabel="Dismiss budget sheet"
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={contentStyle}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={titleStyle}>Monthly budget</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close budget sheet"
            onPress={handleClose}
            style={closeStyle}
          >
            <Ionicons name="close" size={spacing.xl} color={colors.text} />
          </Pressable>
        </View>
        <View
          style={styles.amountArea}
          accessibilityLabel={`Budget amount ${CURRENCY_SYMBOL}${displayValue}`}
        >
          <View style={styles.amountRow}>
            <Text style={currencyStyle}>{CURRENCY_SYMBOL}</Text>
            <Text style={amountStyle} numberOfLines={1}>
              {displayValue}
            </Text>
          </View>
        </View>
        <Text style={hintStyle}>
          Minimum budget is {formatMoney(MIN_BUDGET_CENTS)}
        </Text>
        <NumberPad
          value={value}
          onChange={setValue}
          onInvalid={handleInvalid}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save budget"
          accessibilityHint="Saves the monthly budget"
          onPress={handleSave}
          style={saveStyle}
        >
          <Text style={saveLabelStyle}>Save budget</Text>
        </Pressable>
      </ScrollView>
    </BottomSheet>
  );
}
