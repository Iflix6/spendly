import { isSameMonth } from "@/lib/dates";
import { selection } from "@/lib/haptics";
import { formatMoney } from "@/lib/money";
import { monthlyDateLabel, totalForMonth } from "@/lib/stats";
import { useExpenseStore } from "@/store/useExpenseStore";
import { useTheme, type ThemeMode } from "@/theme/ThemeProvider";
import {
    fontFamily,
    layout,
    letterSpacing,
    lightCardShadow,
    opacity,
    radii,
    spacing,
    tabularNums,
    typography,
} from "@/theme/tokens";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const THEME_ORDER: readonly ThemeMode[] = ["system", "light", "dark"];

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
  eyebrow: {
    ...typography.caption,
    letterSpacing: letterSpacing.wide,
    textTransform: "uppercase",
  },
  title: {
    ...typography.title,
    marginTop: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    marginTop: spacing.xs,
  },
  card: {
    borderRadius: radii.card,
    padding: spacing.xl,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLabel: {
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: letterSpacing.label,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  liveDot: {
    width: layout.indicatorSize,
    height: layout.indicatorSize,
    borderRadius: radii.pill,
  },
  liveText: {
    ...typography.caption,
  },
  amount: {
    ...typography.display,
    ...tabularNums,
    marginTop: spacing.lg,
  },
  month: {
    ...typography.body,
    ...tabularNums,
    marginTop: spacing.xs,
  },
  divider: {
    height: layout.borderWidth,
    marginVertical: spacing.xl,
  },
  count: {
    ...typography.headline,
    ...tabularNums,
  },
  countLabel: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  section: {
    marginTop: spacing.xxl,
  },
  sectionTitle: {
    ...typography.headline,
  },
  sectionBody: {
    ...typography.body,
    marginTop: spacing.sm,
  },
  themeButton: {
    minHeight: layout.minTouchTarget,
    borderRadius: radii.input,
    borderWidth: layout.borderWidth,
    paddingHorizontal: spacing.base,
    marginTop: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  themeButtonText: {
    ...typography.body,
    fontFamily: fontFamily.semibold,
  },
  footer: {
    ...typography.caption,
    marginTop: spacing.xxl,
    textAlign: "center",
  },
});

export default function HomeScreen() {
  const { colors, isDark, mode, setMode } = useTheme();
  const expenses = useExpenseStore((state) => state.expenses);
  const now = useMemo(() => new Date(), []);
  const monthTotal = useMemo(
    () => totalForMonth(expenses, now),
    [expenses, now],
  );
  const monthCount = useMemo(
    () =>
      expenses.filter((expense) => isSameMonth(new Date(expense.date), now))
        .length,
    [expenses, now],
  );

  const cycleTheme = () => {
    const currentIndex = THEME_ORDER.indexOf(mode);
    const nextMode = THEME_ORDER[(currentIndex + 1) % THEME_ORDER.length];
    void selection();
    setMode(nextMode);
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "bottom", "left", "right"]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>
            Offline expense tracker
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>Spendly</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Phase 1 foundation preview
          </Text>
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: isDark ? layout.borderWidth : 0,
              shadowOpacity: isDark ? 0 : lightCardShadow.shadowOpacity,
              shadowRadius: lightCardShadow.shadowRadius,
              shadowColor: lightCardShadow.shadowColor,
              shadowOffset: lightCardShadow.shadowOffset,
              elevation: isDark ? 0 : lightCardShadow.elevation,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>
              This month
            </Text>
            <View style={styles.liveBadge}>
              <View
                style={[styles.liveDot, { backgroundColor: colors.success }]}
              />
              <Text style={[styles.liveText, { color: colors.textMuted }]}>
                Local data
              </Text>
            </View>
          </View>
          <Text style={[styles.amount, { color: colors.text }]}>
            {formatMoney(monthTotal)}
          </Text>
          <Text style={[styles.month, { color: colors.textMuted }]}>
            {monthlyDateLabel(now)}
          </Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.count, { color: colors.text }]}>
            {monthCount}
          </Text>
          <Text style={[styles.countLabel, { color: colors.textMuted }]}>
            expenses recorded this month
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Foundation check
          </Text>
          <Text style={[styles.sectionBody, { color: colors.textMuted }]}>
            Typography, theming, deterministic seed data, and local persistence
            are connected. No account or network connection is required.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Change theme. Current theme: ${mode}`}
            onPress={cycleTheme}
            style={({ pressed }) => [
              styles.themeButton,
              {
                backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
                borderColor: colors.border,
                opacity: pressed ? opacity.muted : 1,
              },
            ]}
          >
            <Text style={[styles.themeButtonText, { color: colors.accent }]}>
              Theme: {mode}
            </Text>
          </Pressable>
        </View>

        <Text style={[styles.footer, { color: colors.textMuted }]}>
          Your demo expenses stay on this device.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
