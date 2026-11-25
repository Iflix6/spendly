import { AnimatedNumber } from "@/components/AnimatedNumber";
import { BudgetRing } from "@/components/BudgetRing";
import { BudgetSheet } from "@/components/BudgetSheet";
import { Card } from "@/components/Card";
import { CategoryCard } from "@/components/CategoryCard";
import { EmptyState } from "@/components/EmptyState";
import { ExpenseRow } from "@/components/ExpenseRow";
import { SettingsSheet } from "@/components/SettingsSheet";
import { CENTS_PER_DOLLAR, CURRENCY_SYMBOL } from "@/constants";
import { CATEGORIES, type CategoryId } from "@/constants/categories";
import { BUDGET_RING, HOME } from "@/constants/home";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { getBudgetRingState } from "@/lib/budget";
import { isSameMonth } from "@/lib/dates";
import { selection } from "@/lib/haptics";
import {
    markHomeEntrancePresent,
    shouldPresentHomeEntrance,
} from "@/lib/homeEntrance";
import { formatMoney } from "@/lib/money";
import { monthlyDateLabel, totalForMonth, totalsByCategory } from "@/lib/stats";
import { useExpenseStore, type Expense } from "@/store/useExpenseStore";
import { durations, easing } from "@/theme/motion";
import { useTheme } from "@/theme/ThemeProvider";
import {
    fontFamily,
    layout,
    letterSpacing,
    radii,
    spacing,
    tabularNums,
    typography,
} from "@/theme/tokens";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import {
    Fragment,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const styles = StyleSheet.create({
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
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  eyebrow: {
    ...typography.caption,
    fontFamily: fontFamily.semibold,
    letterSpacing: letterSpacing.label,
  },
  wordmark: {
    ...typography.title,
    fontFamily: fontFamily.bold,
  },
  subtitle: {
    ...typography.caption,
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
  heroCard: {
    padding: spacing.lg,
    gap: spacing.xl,
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.base,
  },
  heroLabel: {
    ...typography.body,
    fontFamily: fontFamily.semibold,
  },
  editButton: {
    minHeight: layout.minTouchTarget,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
  },
  editLabel: {
    ...typography.caption,
    fontFamily: fontFamily.semibold,
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base,
  },
  heroText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  heroAmount: {
    ...typography.display,
    ...tabularNums,
  },
  heroCaption: {
    ...typography.caption,
  },
  remainingPill: {
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  remainingLabel: {
    ...typography.caption,
    fontFamily: fontFamily.semibold,
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
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.xl,
    columnGap: spacing.md,
    rowGap: spacing.md,
  },
  categoryCell: {
    width: "48%",
    minWidth: 0,
  },
  recentSection: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  recentCard: {
    padding: spacing.base,
  },
  recentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: spacing.xxl,
    marginBottom: spacing.xs,
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
  divider: {
    height: layout.borderWidth,
  },
  emptySection: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  emptyCard: {
    paddingBottom: spacing.base,
  },
});

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
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
  const budgetState = useMemo(
    () => getBudgetRingState(totalCents, budgetCents),
    [budgetCents, totalCents],
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

  const eyebrowStyle = useMemo(
    () => [styles.eyebrow, { color: colors.accentText }],
    [colors.accentText],
  );
  const wordmarkStyle = useMemo(
    () => [styles.wordmark, { color: colors.text }],
    [colors.text],
  );
  const subtitleStyle = useMemo(
    () => [styles.subtitle, { color: colors.mutedText }],
    [colors.mutedText],
  );
  const settingsButtonStyle = useMemo(
    () => [
      styles.settingsButton,
      {
        backgroundColor: colors.surfaceAlt,
        borderColor: colors.border,
      },
    ],
    [colors.border, colors.surfaceAlt],
  );
  const heroLabelStyle = useMemo(
    () => [styles.heroLabel, { color: colors.text }],
    [colors.text],
  );
  const heroAmountStyle = useMemo(
    () => [styles.heroAmount, { color: colors.text }],
    [colors.text],
  );
  const heroCaptionStyle = useMemo(
    () => [styles.heroCaption, { color: colors.mutedText }],
    [colors.mutedText],
  );
  const editButtonStyle = useMemo(
    () => [styles.editButton, { backgroundColor: colors.surfaceAlt }],
    [colors.surfaceAlt],
  );
  const editLabelStyle = useMemo(
    () => [styles.editLabel, { color: colors.accentText }],
    [colors.accentText],
  );
  const remainingPillStyle = useMemo(
    () => [styles.remainingPill, { backgroundColor: colors.surfaceAlt }],
    [colors.surfaceAlt],
  );
  const remainingLabelStyle = useMemo(
    () => [
      styles.remainingLabel,
      {
        color: budgetState.isOverBudget ? colors.dangerText : colors.accentText,
      },
    ],
    [budgetState.isOverBudget, colors.accentText, colors.dangerText],
  );
  const sectionTitleStyle = useMemo(
    () => [styles.sectionTitle, { color: colors.text }],
    [colors.text],
  );
  const seeAllLabelStyle = useMemo(
    () => [styles.seeAllLabel, { color: colors.accentText }],
    [colors.accentText],
  );
  const dividerStyle = useMemo(
    () => [styles.divider, { backgroundColor: colors.border }],
    [colors.border],
  );
  const contentStyle = useMemo(
    () => [styles.content, { paddingBottom: bottomPadding }],
    [bottomPadding],
  );
  const remainingLabel = budgetState.isOverBudget
    ? `${formatMoney(Math.abs(budgetState.remainingCents))} over budget`
    : `${formatMoney(budgetState.remainingCents)} left to spend`;

  return (
    <>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <ScrollView
          contentContainerStyle={contentStyle}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={eyebrowStyle}>YOUR MONEY, AT A GLANCE</Text>
              <Text accessibilityRole="header" style={wordmarkStyle}>
                Spendly
              </Text>
              <Text style={subtitleStyle}>{monthlyDateLabel(month)}</Text>
            </View>
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
                color={colors.accent}
              />
            </Pressable>
          </View>

          <Animated.View entering={getEntrance(0)} style={styles.heroWrapper}>
            <Card style={styles.heroCard}>
              <View style={styles.heroHeader}>
                <Text style={heroLabelStyle}>Monthly budget</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Edit monthly budget"
                  accessibilityHint="Opens the monthly budget editor"
                  onPress={handleOpenBudget}
                  style={editButtonStyle}
                >
                  <Ionicons
                    name="pencil-outline"
                    size={typography.caption.fontSize}
                    color={colors.accent}
                  />
                  <Text style={editLabelStyle}>Edit</Text>
                </Pressable>
              </View>
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
                  <View style={remainingPillStyle}>
                    <Text style={remainingLabelStyle}>{remainingLabel}</Text>
                  </View>
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
            </Card>
          </Animated.View>

          {monthExpenses.length === 0 ? (
            <Animated.View
              entering={getEntrance(1)}
              style={styles.emptySection}
            >
              <Card style={styles.emptyCard}>
                <EmptyState
                  hasFilters={false}
                  onAdd={handleAddExpense}
                  embedded
                />
              </Card>
            </Animated.View>
          ) : (
            <>
              <Animated.View entering={getEntrance(1)} style={styles.section}>
                <View style={styles.sectionHeading}>
                  <Text accessibilityRole="header" style={sectionTitleStyle}>
                    Spending by category
                  </Text>
                </View>
                <View style={styles.categoryGrid}>
                  {CATEGORIES.map((category) => (
                    <View key={category.id} style={styles.categoryCell}>
                      <CategoryCard
                        category={category}
                        amountCents={categoryTotals[category.id]}
                        progress={
                          largestCategoryCents > 0
                            ? categoryTotals[category.id] / largestCategoryCents
                            : 0
                        }
                        onPress={handleCategoryPress}
                      />
                    </View>
                  ))}
                </View>
              </Animated.View>

              <Animated.View
                entering={getEntrance(2)}
                style={styles.recentSection}
              >
                <Card style={styles.recentCard}>
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
                    <Fragment key={expense.id}>
                      {index > 0 ? <View style={dividerStyle} /> : null}
                      <ExpenseRow
                        expense={expense}
                        onPress={handleExpensePress}
                        contained
                      />
                    </Fragment>
                  ))}
                </Card>
              </Animated.View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
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
