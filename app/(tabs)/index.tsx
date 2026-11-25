import { AnimatedNumber } from "@/components/AnimatedNumber";
import { BudgetRing } from "@/components/BudgetRing";
import { BudgetSheet } from "@/components/BudgetSheet";
import { CategoryCard } from "@/components/CategoryCard";
import { EmptyState } from "@/components/EmptyState";
import { ExpenseRow } from "@/components/ExpenseRow";
import { SettingsSheet } from "@/components/SettingsSheet";
import { useTabBlurTarget } from "@/components/TabBlurTargetContext";
import { CENTS_PER_DOLLAR, CURRENCY_SYMBOL } from "@/constants";
import { CATEGORIES, type CategoryId } from "@/constants/categories";
import { BUDGET_RING, HOME } from "@/constants/home";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { isSameMonth } from "@/lib/dates";
import { selection } from "@/lib/haptics";
import {
    markHomeEntrancePresent,
    shouldPresentHomeEntrance,
} from "@/lib/homeEntrance";
import { formatMoney } from "@/lib/money";
import { totalForMonth, totalsByCategory } from "@/lib/stats";
import { useExpenseStore, type Expense } from "@/store/useExpenseStore";
import { durations, easing } from "@/theme/motion";
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
import Ionicons from "@expo/vector-icons/Ionicons";
import { BlurTargetView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useIsFocused, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const styles = StyleSheet.create({
  target: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    gap: spacing.base,
  },
  wordmark: {
    ...typography.title,
    fontFamily: fontFamily.bold,
  },
  settingsButton: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.input,
    borderWidth: layout.borderWidth,
  },
  heroWrapper: {
    paddingHorizontal: spacing.xl,
  },
  hero: {
    borderRadius: radii.card,
    borderWidth: layout.borderWidth,
    overflow: "hidden",
  },
  gradient: {
    ...StyleSheet.absoluteFill,
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    gap: spacing.base,
  },
  heroText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.sm,
  },
  heroLabel: {
    ...typography.body,
    fontFamily: fontFamily.semibold,
  },
  heroAmount: {
    ...typography.display,
    ...tabularNums,
  },
  heroCaption: {
    ...typography.caption,
  },
  ringButton: {
    minHeight: layout.minTouchTarget,
    minWidth: layout.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    paddingTop: spacing.xl,
  },
  sectionHeading: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.headline,
  },
  categoryScroll: {
    flexGrow: 0,
  },
  categoryContent: {
    flexDirection: "row",
    paddingHorizontal: spacing.xl,
    paddingRight: spacing.xl,
    gap: spacing.md,
  },
  recentSection: {
    paddingHorizontal: spacing.xl,
  },
  recentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: spacing.xxl,
    marginBottom: spacing.sm,
    gap: spacing.base,
  },
  seeAll: {
    minHeight: layout.minTouchTarget,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  seeAllLabel: {
    ...typography.body,
    fontFamily: fontFamily.semibold,
  },
});

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const isFocused = useIsFocused();
  const blurTarget = useTabBlurTarget();
  const reduceMotion = useReducedMotionSafe();
  const bottomPadding = useTabBarHeight();
  const expenses = useExpenseStore((state) => state.expenses);
  const budgetCents = useExpenseStore((state) => state.budgetCents);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const animateEntrance = useRef(shouldPresentHomeEntrance()).current;
  const month = useMemo(() => new Date(), []);

  useEffect(() => {
    markHomeEntrancePresent();
  }, []);

  const monthExpenses = useMemo(
    () =>
      expenses
        .filter((expense) => isSameMonth(new Date(expense.date), month))
        .sort(
          (first, second) =>
            second.date.localeCompare(first.date) ||
            second.createdAt - first.createdAt,
        ),
    [expenses, month],
  );
  const totalCents = useMemo(
    () => totalForMonth(expenses, month),
    [expenses, month],
  );
  const categoryTotals = useMemo(
    () => totalsByCategory(expenses, month),
    [expenses, month],
  );
  const largestCategoryCents = useMemo(
    () => Math.max(...Object.values(categoryTotals)),
    [categoryTotals],
  );
  const recentExpenses = useMemo(
    () => monthExpenses.slice(0, HOME.recentLimit),
    [monthExpenses],
  );

  const getEntrance = useCallback(
    (index: number) => {
      if (!animateEntrance) {
        return undefined;
      }

      return reduceMotion
        ? FadeIn.duration(durations.reduced)
        : FadeInDown.duration(durations.base)
            .delay(index * HOME.entranceStaggerMs)
            .easing(easing.entrance);
    },
    [animateEntrance, reduceMotion],
  );
  const handleOpenSettings = useCallback(() => {
    void selection();
    setSettingsOpen(true);
  }, []);
  const handleOpenBudget = useCallback(() => {
    void selection();
    setBudgetOpen(true);
  }, []);
  const handleEditBudgetFromSettings = useCallback(() => {
    setSettingsOpen(false);
    setBudgetOpen(true);
  }, []);
  const handleCloseSettings = useCallback(() => {
    setSettingsOpen(false);
  }, []);
  const handleCloseBudget = useCallback(() => {
    setBudgetOpen(false);
  }, []);
  const handleCategoryPress = useCallback(
    (categoryId: CategoryId) => {
      void selection();
      router.navigate(`/(tabs)/expenses?category=${categoryId}`);
    },
    [router],
  );
  const handleSeeAll = useCallback(() => {
    void selection();
    router.navigate("/(tabs)/expenses?category=all");
  }, [router]);
  const handleExpensePress = useCallback(
    (expense: Expense) => {
      router.push(`/expense/${expense.id}`);
    },
    [router],
  );
  const handleAddExpense = useCallback(() => {
    router.push("/add");
  }, [router]);

  const wordmarkStyle = useMemo(
    () => [styles.wordmark, { color: colors.text }],
    [colors.text],
  );
  const settingsButtonStyle = useMemo(
    () => [
      styles.settingsButton,
      {
        backgroundColor: colors.surface,
        borderColor: colors.border,
      },
    ],
    [colors.border, colors.surface],
  );
  const heroStyle = useMemo(
    () => [
      styles.hero,
      { borderColor: isDark ? colors.border : colors.accent },
      isDark ? null : lightCardShadow,
    ],
    [colors.accent, colors.border, isDark],
  );
  const heroLabelStyle = useMemo(
    () => [styles.heroLabel, { color: colors.onAccent }],
    [colors.onAccent],
  );
  const heroAmountStyle = useMemo(
    () => [styles.heroAmount, { color: colors.onAccent }],
    [colors.onAccent],
  );
  const heroCaptionStyle = useMemo(
    () => [styles.heroCaption, { color: colors.onAccent }],
    [colors.onAccent],
  );
  const sectionTitleStyle = useMemo(
    () => [styles.sectionTitle, { color: colors.text }],
    [colors.text],
  );
  const seeAllLabelStyle = useMemo(
    () => [styles.seeAllLabel, { color: colors.accentText }],
    [colors.accentText],
  );
  const contentStyle = useMemo(
    () => [styles.content, { paddingBottom: bottomPadding }],
    [bottomPadding],
  );

  return (
    <>
      <BlurTargetView
        ref={isFocused ? blurTarget : undefined}
        style={styles.target}
      >
        <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
          <ScrollView
            style={styles.content}
            contentContainerStyle={contentStyle}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text accessibilityRole="header" style={wordmarkStyle}>
                Spendly
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open settings"
                accessibilityHint="Opens appearance, budget, and demo data settings"
                onPress={handleOpenSettings}
                style={settingsButtonStyle}
              >
                <Ionicons
                  name="settings-outline"
                  size={spacing.xl}
                  color={colors.text}
                />
              </Pressable>
            </View>

            <View style={styles.heroWrapper}>
              <Animated.View entering={getEntrance(0)} style={heroStyle}>
                <LinearGradient
                  colors={[colors.accent, colors.accentDeep]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradient}
                />
                {monthExpenses.length > 0 ? (
                  <View style={styles.heroContent}>
                    <View style={styles.heroText}>
                      <Text style={heroLabelStyle}>Spent this month</Text>
                      <AnimatedNumber
                        value={totalCents / CENTS_PER_DOLLAR}
                        prefix={CURRENCY_SYMBOL}
                        style={heroAmountStyle}
                        accessibilityLabel={formatMoney(totalCents)}
                        maxFontSizeMultiplier={HOME.amountMaxFontScale}
                      />
                      <Text style={heroCaptionStyle}>
                        of {formatMoney(budgetCents)} budget
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Edit monthly budget, currently ${formatMoney(budgetCents)}`}
                      accessibilityHint="Opens the monthly budget editor"
                      onPress={handleOpenBudget}
                      style={styles.ringButton}
                    >
                      <BudgetRing
                        spentCents={totalCents}
                        budgetCents={budgetCents}
                        size={BUDGET_RING.defaultSize}
                      />
                    </Pressable>
                  </View>
                ) : (
                  <EmptyState
                    hasFilters={false}
                    onAdd={handleAddExpense}
                    onAccent
                    embedded
                  />
                )}
              </Animated.View>
            </View>

            {monthExpenses.length > 0 ? (
              <Animated.View entering={getEntrance(1)} style={styles.section}>
                <View style={styles.sectionHeading}>
                  <Text accessibilityRole="header" style={sectionTitleStyle}>
                    This month by category
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  style={styles.categoryScroll}
                  contentContainerStyle={styles.categoryContent}
                  showsHorizontalScrollIndicator={false}
                >
                  {CATEGORIES.map((category) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      amountCents={categoryTotals[category.id]}
                      progress={
                        largestCategoryCents > 0
                          ? categoryTotals[category.id] / largestCategoryCents
                          : 0
                      }
                      onPress={handleCategoryPress}
                    />
                  ))}
                </ScrollView>
              </Animated.View>
            ) : null}

            {recentExpenses.length > 0 ? (
              <Animated.View
                entering={getEntrance(2)}
                style={[styles.section, styles.recentSection]}
              >
                <View style={styles.recentHeader}>
                  <Text accessibilityRole="header" style={sectionTitleStyle}>
                    Recent
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="See all expenses"
                    onPress={handleSeeAll}
                    style={styles.seeAll}
                  >
                    <Text style={seeAllLabelStyle}>See all</Text>
                  </Pressable>
                </View>
                {recentExpenses.map((expense, index) => (
                  <Animated.View
                    key={expense.id}
                    entering={getEntrance(index + 3)}
                  >
                    <ExpenseRow
                      expense={expense}
                      onPress={handleExpensePress}
                    />
                  </Animated.View>
                ))}
              </Animated.View>
            ) : null}
          </ScrollView>
        </SafeAreaView>
      </BlurTargetView>
      {settingsOpen ? (
        <SettingsSheet
          onDismiss={handleCloseSettings}
          onEditBudget={handleEditBudgetFromSettings}
        />
      ) : null}
      {budgetOpen ? <BudgetSheet onDismiss={handleCloseBudget} /> : null}
    </>
  );
}
