import { AnimatedNumber } from "@/components/AnimatedNumber";
import { BarChart } from "@/components/BarChart";
import { Card } from "@/components/Card";
import { DeltaPill } from "@/components/DeltaPill";
import { DonutChart, type DonutDatum } from "@/components/DonutChart";
import { EmptyState } from "@/components/EmptyState";
import { MonthSelector } from "@/components/MonthSelector";
import { CENTS_PER_DOLLAR, CURRENCY_SYMBOL } from "@/constants";
import { CATEGORIES } from "@/constants/categories";
import { STATS_SCREEN } from "@/constants/stats";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { isSameMonth, localDateKey } from "@/lib/dates";
import { selection } from "@/lib/haptics";
import { formatMoney } from "@/lib/money";
import {
    monthDelta,
    spendByDay,
    spendByWeek,
    totalForMonth,
    totalsByCategory,
} from "@/lib/stats";
import { useExpenseStore, type Expense } from "@/store/useExpenseStore";
import { useTheme } from "@/theme/ThemeProvider";
import {
    fontFamily,
    letterSpacing,
    spacing,
    tabularNums,
    typography,
} from "@/theme/tokens";
import { addMonths, startOfMonth, subMonths } from "date-fns";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  header: {
    marginBottom: spacing.base,
    gap: spacing.xs,
  },
  eyebrow: {
    ...typography.caption,
    fontFamily: fontFamily.semibold,
    letterSpacing: letterSpacing.label,
  },
  title: {
    ...typography.title,
    fontFamily: fontFamily.bold,
  },
  totalCard: {
    marginTop: spacing.xl,
    padding: spacing.xl,
  },
  totalSection: {
    gap: spacing.sm,
  },
  totalLabel: {
    ...typography.body,
    fontFamily: fontFamily.semibold,
  },
  totalAmount: {
    ...typography.display,
    ...tabularNums,
  },
  card: {
    marginTop: spacing.xl,
    padding: STATS_SCREEN.cardPadding,
  },
  sectionHeading: {
    marginBottom: spacing.base,
  },
  sectionTitle: {
    ...typography.headline,
  },
  emptyCard: {
    marginTop: spacing.xl,
    minHeight: STATS_SCREEN.emptyCardMinHeight,
    justifyContent: "center",
  },
});

function earliestExpenseMonth(
  expenses: readonly Expense[],
  fallback: Date,
): Date {
  let earliest: Date | null = null;

  for (const expense of expenses) {
    const date = new Date(expense.date);
    if (Number.isNaN(date.getTime())) {
      continue;
    }

    const month = startOfMonth(date);
    if (earliest === null || month.getTime() < earliest.getTime()) {
      earliest = month;
    }
  }

  return earliest ?? fallback;
}

export default function StatsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const bottomPadding = useTabBarHeight();
  const expenses = useExpenseStore((state) => state.expenses);
  const currentMonth = useMemo(() => startOfMonth(new Date()), []);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [direction, setDirection] = useState<-1 | 0 | 1>(0);
  const earliestMonth = useMemo(
    () => earliestExpenseMonth(expenses, currentMonth),
    [currentMonth, expenses],
  );
  const monthKey = localDateKey(selectedMonth);
  const canGoPrevious = selectedMonth.getTime() > earliestMonth.getTime();
  const canGoNext = selectedMonth.getTime() < currentMonth.getTime();
  const isCurrentMonth = isSameMonth(selectedMonth, currentMonth);
  const monthExpenses = useMemo(
    () =>
      expenses.filter((expense) =>
        isSameMonth(new Date(expense.date), selectedMonth),
      ),
    [expenses, selectedMonth],
  );
  const totalCents = useMemo(
    () => totalForMonth(expenses, selectedMonth),
    [expenses, selectedMonth],
  );
  const previousTotalCents = useMemo(
    () => totalForMonth(expenses, subMonths(selectedMonth, 1)),
    [expenses, selectedMonth],
  );
  const deltaPercent = useMemo(
    () => monthDelta(expenses, selectedMonth),
    [expenses, selectedMonth],
  );
  const categoryTotals = useMemo(
    () => totalsByCategory(expenses, selectedMonth),
    [expenses, selectedMonth],
  );
  const categoryData = useMemo<DonutDatum[]>(
    () =>
      CATEGORIES.map((category) => ({
        categoryId: category.id,
        amountCents: categoryTotals[category.id],
      }))
        .filter((datum) => datum.amountCents > 0)
        .sort((first, second) => second.amountCents - first.amountCents),
    [categoryTotals],
  );
  const weekData = useMemo(
    () => spendByWeek(expenses, selectedMonth),
    [expenses, selectedMonth],
  );
  const dayData = useMemo(
    () => spendByDay(expenses, selectedMonth),
    [expenses, selectedMonth],
  );

  const handlePrevious = useCallback(() => {
    if (!canGoPrevious) {
      return;
    }

    void selection();
    setDirection(-1);
    setSelectedMonth((month) => subMonths(month, 1));
  }, [canGoPrevious]);
  const handleNext = useCallback(() => {
    if (!canGoNext) {
      return;
    }

    void selection();
    setDirection(1);
    setSelectedMonth((month) => addMonths(month, 1));
  }, [canGoNext]);
  const handleAddExpense = useCallback(() => {
    void selection();
    router.push("/add");
  }, [router]);

  const eyebrowStyle = useMemo(
    () => [styles.eyebrow, { color: colors.accentText }],
    [colors.accentText],
  );
  const titleStyle = useMemo(
    () => [styles.title, { color: colors.text }],
    [colors.text],
  );
  const totalLabelStyle = useMemo(
    () => [styles.totalLabel, { color: colors.mutedText }],
    [colors.mutedText],
  );
  const totalAmountStyle = useMemo(
    () => [styles.totalAmount, { color: colors.text }],
    [colors.text],
  );
  const sectionTitleStyle = useMemo(
    () => [styles.sectionTitle, { color: colors.text }],
    [colors.text],
  );
  const contentStyle = useMemo(
    () => [styles.content, { paddingBottom: bottomPadding + spacing.xl }],
    [bottomPadding],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={contentStyle}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={eyebrowStyle}>INSIGHTS</Text>
          <Text accessibilityRole="header" style={titleStyle}>
            Stats
          </Text>
        </View>

        <MonthSelector
          month={selectedMonth}
          direction={direction}
          canGoPrevious={canGoPrevious}
          canGoNext={canGoNext}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />

        <Card style={styles.totalCard}>
          <View style={styles.totalSection}>
            <Text style={totalLabelStyle}>Total spent</Text>
            <AnimatedNumber
              value={totalCents / CENTS_PER_DOLLAR}
              prefix={CURRENCY_SYMBOL}
              style={totalAmountStyle}
              accessibilityLabel={`Total spent ${formatMoney(totalCents)}`}
              maxFontSizeMultiplier={STATS_SCREEN.amountMaxFontScale}
            />
            <DeltaPill
              deltaPercent={deltaPercent}
              previousTotalCents={previousTotalCents}
            />
          </View>
        </Card>

        {monthExpenses.length > 0 ? (
          <>
            <Card style={styles.card}>
              <View style={styles.sectionHeading}>
                <Text accessibilityRole="header" style={sectionTitleStyle}>
                  By category
                </Text>
              </View>
              <DonutChart
                key={`donut-${monthKey}`}
                data={categoryData}
                totalCents={totalCents}
              />
            </Card>
            <Card style={styles.card}>
              <View style={styles.sectionHeading}>
                <Text accessibilityRole="header" style={sectionTitleStyle}>
                  Spending over time
                </Text>
              </View>
              <BarChart
                key={`bar-${monthKey}`}
                weekData={weekData}
                dayData={dayData}
                isCurrentMonth={isCurrentMonth}
              />
            </Card>
          </>
        ) : (
          <Card style={[styles.card, styles.emptyCard]}>
            <EmptyState hasFilters={false} onAdd={handleAddExpense} embedded />
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
