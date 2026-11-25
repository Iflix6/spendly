import { BottomSheet, type BottomSheetHandle } from "@/components/BottomSheet";
import { ThemeSegmentedControl } from "@/components/ThemeSegmentedControl";
import { SETTINGS_SHEET } from "@/constants/home";
import { selection, warning } from "@/lib/haptics";
import { formatMoney } from "@/lib/money";
import { useExpenseStore } from "@/store/useExpenseStore";
import { useTheme } from "@/theme/ThemeProvider";
import {
    fontFamily,
    layout,
    radii,
    spacing,
    tabularNums,
    typography,
} from "@/theme/tokens";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SettingsSheetProps {
  onDismiss: () => void;
  onEditBudget: () => void;
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.base,
    gap: spacing.xl,
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
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    ...typography.caption,
  },
  row: {
    minHeight: layout.minTouchTarget,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radii.card,
    borderWidth: layout.borderWidth,
    gap: spacing.base,
  },
  rowText: {
    flex: 1,
    gap: spacing.xs,
  },
  rowLabel: {
    ...typography.body,
    fontFamily: fontFamily.semibold,
  },
  rowValue: {
    ...typography.caption,
    ...tabularNums,
  },
  reset: {
    minHeight: layout.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.base,
    borderRadius: radii.input,
    borderWidth: layout.borderWidth,
  },
  resetLabel: {
    ...typography.body,
    fontFamily: fontFamily.semibold,
  },
  version: {
    ...typography.caption,
    textAlign: "center",
  },
});

export function SettingsSheet({ onDismiss, onEditBudget }: SettingsSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetHandle>(null);
  const budgetCents = useExpenseStore((state) => state.budgetCents);
  const resetDemoData = useExpenseStore((state) => state.resetDemoData);
  const [resetArmed, setResetArmed] = useState(false);
  const resetTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const version = Constants.expoConfig?.version;
  const versionLabel = version ? `Spendly ${version}` : "Spendly";
  const resetLabel = resetArmed ? "Tap again to confirm" : "Reset demo data";

  const clearResetTimeout = useCallback(() => {
    if (resetTimeout.current !== null) {
      clearTimeout(resetTimeout.current);
      resetTimeout.current = null;
    }
  }, []);

  useEffect(() => {
    return clearResetTimeout;
  }, [clearResetTimeout]);

  const handleDismiss = useCallback(() => {
    clearResetTimeout();
    onDismiss();
  }, [clearResetTimeout, onDismiss]);
  const handleClose = useCallback(() => {
    sheetRef.current?.dismiss();
  }, []);
  const handleEditBudget = useCallback(() => {
    void selection();
    onEditBudget();
  }, [onEditBudget]);
  const handleReset = useCallback(() => {
    if (!resetArmed) {
      setResetArmed(true);
      clearResetTimeout();
      resetTimeout.current = setTimeout(() => {
        setResetArmed(false);
        resetTimeout.current = null;
      }, SETTINGS_SHEET.resetConfirmTimeoutMs);
      return;
    }

    clearResetTimeout();
    setResetArmed(false);
    void warning();
    resetDemoData();
    sheetRef.current?.dismiss();
  }, [clearResetTimeout, resetArmed, resetDemoData]);

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
  const sectionLabelStyle = useMemo(
    () => [styles.sectionLabel, { color: colors.textMuted }],
    [colors.textMuted],
  );
  const budgetRowStyle = useMemo(
    () => [
      styles.row,
      {
        backgroundColor: colors.surfaceAlt,
        borderColor: colors.border,
      },
    ],
    [colors.border, colors.surfaceAlt],
  );
  const rowLabelStyle = useMemo(
    () => [styles.rowLabel, { color: colors.text }],
    [colors.text],
  );
  const rowValueStyle = useMemo(
    () => [styles.rowValue, { color: colors.textMuted }],
    [colors.textMuted],
  );
  const resetStyle = useMemo(
    () => [
      styles.reset,
      {
        backgroundColor: colors.surfaceAlt,
        borderColor: resetArmed ? colors.danger : colors.border,
      },
    ],
    [colors.border, colors.danger, colors.surfaceAlt, resetArmed],
  );
  const resetLabelStyle = useMemo(
    () => [styles.resetLabel, { color: colors.danger }],
    [colors.danger],
  );
  const versionStyle = useMemo(
    () => [styles.version, { color: colors.textMuted }],
    [colors.textMuted],
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
      dismissLabel="Dismiss settings"
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={contentStyle}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={titleStyle}>Settings</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close settings"
            onPress={handleClose}
            style={closeStyle}
          >
            <Ionicons name="close" size={spacing.xl} color={colors.text} />
          </Pressable>
        </View>
        <View style={styles.section}>
          <Text style={sectionLabelStyle}>Appearance</Text>
          <ThemeSegmentedControl />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Monthly budget ${formatMoney(budgetCents)}, edit`}
          accessibilityHint="Opens the budget editor"
          onPress={handleEditBudget}
          style={budgetRowStyle}
        >
          <View style={styles.rowText}>
            <Text style={rowLabelStyle}>Monthly budget</Text>
            <Text style={rowValueStyle}>{formatMoney(budgetCents)}</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={spacing.xl}
            color={colors.textMuted}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={resetLabel}
          accessibilityHint={
            resetArmed
              ? "Confirms resetting expenses and budget"
              : "Resets expenses and budget to demo data"
          }
          onPress={handleReset}
          style={resetStyle}
        >
          <Text style={resetLabelStyle}>{resetLabel}</Text>
        </Pressable>
        <Text style={versionStyle}>{versionLabel}</Text>
      </ScrollView>
    </BottomSheet>
  );
}
