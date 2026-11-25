import { Card } from "@/components/Card";
import { CategoryChip } from "@/components/CategoryChip";
import { EmptyState } from "@/components/EmptyState";
import { SearchBar } from "@/components/SearchBar";
import { SectionHeader } from "@/components/SectionHeader";
import { useSnackbar } from "@/components/SnackbarProvider";
import { SwipeableRow } from "@/components/SwipeableRow";
import { CATEGORIES, type Category } from "@/constants/categories";
import {
    EXPENSE_LIST_MOTION,
    EXPENSE_SEARCH_DEBOUNCE_MS,
} from "@/constants/expenses";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import {
    categoryFilterFromParam,
    groupExpensesByDay,
    type CategoryFilter,
    type ExpenseSection,
} from "@/lib/expenses";
import { selection } from "@/lib/haptics";
import { formatMoney } from "@/lib/money";
import { useExpenseStore, type Expense } from "@/store/useExpenseStore";
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ScrollView,
    SectionList,
    StyleSheet,
    Text,
    View,
    type SectionListProps,
    type SectionListRenderItemInfo,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface CategoryOption {
  id: CategoryFilter;
  category: Category | null;
  label: string;
}

const CATEGORY_OPTIONS: readonly CategoryOption[] = [
  { id: "all", category: null, label: "All" },
  ...CATEGORIES.map((category) => ({
    id: category.id,
    category,
    label: category.label,
  })),
];

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  screenHeader: {
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
  screenSubtitle: {
    ...typography.caption,
  },
  screenTitle: typography.title,
  totalContainer: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  totalLabel: {
    ...typography.caption,
  },
  screenTotal: {
    ...typography.headline,
    ...tabularNums,
  },
  searchContainer: {
    paddingHorizontal: spacing.xl,
  },
  filterPanel: {
    padding: spacing.base,
    borderRadius: radii.card,
    borderWidth: layout.borderWidth,
  },
  chipsScroll: {
    flexGrow: 0,
  },
  chipsContent: {
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.base,
  },
});

type SectionHeaderRenderer = NonNullable<
  SectionListProps<Expense, ExpenseSection>["renderSectionHeader"]
>;

const keyExtractor = (expense: Expense): string => expense.id;

export default function ExpensesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string | string[] }>();
  const routeCategory = useMemo(
    () => categoryFilterFromParam(params.category),
    [params.category],
  );
  const bottomPadding = useTabBarHeight();
  const expenses = useExpenseStore((state) => state.expenses);
  const deleteExpense = useExpenseStore((state) => state.deleteExpense);
  const undoDelete = useExpenseStore((state) => state.undoDelete);
  const { showSnackbar } = useSnackbar();
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>(routeCategory);
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const isInitialRender = useRef(true);
  const debouncedSearch = useDebouncedValue(
    searchText,
    EXPENSE_SEARCH_DEBOUNCE_MS,
  );

  useEffect(() => {
    isInitialRender.current = false;
  }, []);

  useEffect(() => {
    setSelectedCategory(routeCategory);
    setOpenRowId(null);
  }, [routeCategory]);

  const sections = useMemo(
    () => groupExpensesByDay(expenses, debouncedSearch, selectedCategory),
    [debouncedSearch, expenses, selectedCategory],
  );
  const visibleTotalCents = useMemo(
    () => sections.reduce((total, section) => total + section.totalCents, 0),
    [sections],
  );
  const hasFilters = searchText.trim().length > 0 || selectedCategory !== "all";

  const handleRowPress = useCallback(
    (expense: Expense) => {
      router.push(`/expense/${expense.id}`);
    },
    [router],
  );
  const handleOpenRow = useCallback((id: string) => {
    setOpenRowId((current) => (current === id ? current : id));
  }, []);
  const handleCloseRow = useCallback((id: string) => {
    setOpenRowId((current) => (current === id ? null : current));
  }, []);
  const handleDelete = useCallback(
    (id: string) => {
      deleteExpense(id);
      setOpenRowId(null);
      showSnackbar({
        message: "Expense deleted",
        actionLabel: "Undo",
        onAction: undoDelete,
      });
    },
    [deleteExpense, showSnackbar, undoDelete],
  );
  const handleClearSearch = useCallback(() => {
    setSearchText("");
  }, []);
  const handleClearFilters = useCallback(() => {
    setSearchText("");
    setSelectedCategory("all");
    setOpenRowId(null);
    router.setParams({ category: "all" });
  }, [router]);
  const handleCategoryPress = useCallback(
    (category: CategoryFilter | null) => {
      void selection();
      const filter = category ?? "all";
      const nextCategory = selectedCategory === filter ? "all" : filter;
      setSelectedCategory(nextCategory);
      setOpenRowId(null);
      router.setParams({ category: nextCategory });
    },
    [router, selectedCategory],
  );

  const renderItem = useCallback(
    ({
      item,
      index,
      section,
    }: SectionListRenderItemInfo<Expense, ExpenseSection>) => (
      <SwipeableRow
        expense={item}
        isOpen={openRowId === item.id}
        initialRender={isInitialRender.current}
        entranceIndex={section.startIndex + index}
        onOpen={handleOpenRow}
        onClose={handleCloseRow}
        onDelete={handleDelete}
        onPress={handleRowPress}
      />
    ),
    [handleCloseRow, handleDelete, handleOpenRow, handleRowPress, openRowId],
  );
  const renderSectionHeader = useCallback<SectionHeaderRenderer>(
    ({ section }) => (
      <SectionHeader title={section.title} totalCents={section.totalCents} />
    ),
    [],
  );
  const listEmptyComponent = useMemo(
    () => (
      <EmptyState hasFilters={hasFilters} onClearFilters={handleClearFilters} />
    ),
    [handleClearFilters, hasFilters],
  );

  const eyebrowStyle = useMemo(
    () => [styles.eyebrow, { color: colors.accentText }],
    [colors.accentText],
  );
  const screenTitleStyle = useMemo(
    () => [styles.screenTitle, { color: colors.text }],
    [colors.text],
  );
  const screenSubtitleStyle = useMemo(
    () => [styles.screenSubtitle, { color: colors.mutedText }],
    [colors.mutedText],
  );
  const totalLabelStyle = useMemo(
    () => [styles.totalLabel, { color: colors.mutedText }],
    [colors.mutedText],
  );
  const screenTotalStyle = useMemo(
    () => [styles.screenTotal, { color: colors.text }],
    [colors.text],
  );
  const filterPanelStyle = useMemo(
    () => [
      styles.filterPanel,
      { backgroundColor: colors.surface, borderColor: colors.border },
    ],
    [colors.border, colors.surface],
  );
  const listContentStyle = useMemo(
    () => [styles.listContent, { paddingBottom: bottomPadding }],
    [bottomPadding],
  );
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.screenHeader}>
        <View style={styles.headerText}>
          <Text style={eyebrowStyle}>TRANSACTIONS</Text>
          <Text accessibilityRole="header" style={screenTitleStyle}>
            Expenses
          </Text>
          <Text style={screenSubtitleStyle}>Every purchase, organized</Text>
        </View>
        <View style={styles.totalContainer}>
          <Text style={totalLabelStyle}>Filtered total</Text>
          <Text style={screenTotalStyle}>{formatMoney(visibleTotalCents)}</Text>
        </View>
      </View>
      <View style={styles.searchContainer}>
        <Card style={filterPanelStyle}>
          <SearchBar
            value={searchText}
            onChangeText={setSearchText}
            onClear={handleClearSearch}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScroll}
            contentContainerStyle={styles.chipsContent}
          >
            {CATEGORY_OPTIONS.map((option) => (
              <CategoryChip
                key={option.id}
                category={option.category}
                label={option.label}
                selected={selectedCategory === option.id}
                onPress={handleCategoryPress}
              />
            ))}
          </ScrollView>
        </Card>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ListEmptyComponent={listEmptyComponent}
        contentContainerStyle={listContentStyle}
        stickySectionHeadersEnabled
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        initialNumToRender={EXPENSE_LIST_MOTION.initialNumToRender}
        extraData={openRowId}
      />
    </SafeAreaView>
  );
}
