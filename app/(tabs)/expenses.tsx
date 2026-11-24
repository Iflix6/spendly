import { CategoryChip } from "@/components/CategoryChip";
import { EmptyState } from "@/components/EmptyState";
import { SearchBar } from "@/components/SearchBar";
import { SectionHeader } from "@/components/SectionHeader";
import { Snackbar } from "@/components/Snackbar";
import { SwipeableRow } from "@/components/SwipeableRow";
import { useTabBlurTarget } from "@/components/TabBlurTargetContext";
import { CATEGORIES, type Category } from "@/constants/categories";
import {
    EXPENSE_LIST_MOTION,
    EXPENSE_SEARCH_DEBOUNCE_MS,
} from "@/constants/expenses";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import {
    groupExpensesByDay,
    type CategoryFilter,
    type ExpenseSection,
} from "@/lib/expenses";
import { selection } from "@/lib/haptics";
import { formatMoney } from "@/lib/money";
import { useExpenseStore, type Expense } from "@/store/useExpenseStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing, tabularNums, typography } from "@/theme/tokens";
import { BlurTargetView } from "expo-blur";
import { useIsFocused, useRouter } from "expo-router";
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
  target: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  screenHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    gap: spacing.base,
  },
  screenTitle: typography.title,
  screenTotal: {
    ...typography.headline,
    ...tabularNums,
  },
  searchContainer: {
    paddingHorizontal: spacing.xl,
  },
  chipsScroll: {
    flexGrow: 0,
  },
  chipsContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
  },
});

type SectionHeaderRenderer = NonNullable<
  SectionListProps<Expense, ExpenseSection>["renderSectionHeader"]
>;

const keyExtractor = (expense: Expense): string => expense.id;

export default function ExpensesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const isFocused = useIsFocused();
  const blurTarget = useTabBlurTarget();
  const bottomPadding = useTabBarHeight();
  const expenses = useExpenseStore((state) => state.expenses);
  const deleteExpense = useExpenseStore((state) => state.deleteExpense);
  const undoDelete = useExpenseStore((state) => state.undoDelete);
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>("all");
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    id: number;
    message: string;
  } | null>(null);
  const snackbarId = useRef(0);
  const isInitialRender = useRef(true);
  const debouncedSearch = useDebouncedValue(
    searchText,
    EXPENSE_SEARCH_DEBOUNCE_MS,
  );

  useEffect(() => {
    isInitialRender.current = false;
  }, []);

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
      snackbarId.current += 1;
      setSnackbar({ id: snackbarId.current, message: "Expense deleted" });
    },
    [deleteExpense],
  );
  const handleUndo = useCallback(() => {
    undoDelete();
    setSnackbar(null);
  }, [undoDelete]);
  const handleDismissSnackbar = useCallback(() => {
    setSnackbar(null);
  }, []);
  const handleClearSearch = useCallback(() => {
    setSearchText("");
  }, []);
  const handleClearFilters = useCallback(() => {
    setSearchText("");
    setSelectedCategory("all");
    setOpenRowId(null);
  }, []);
  const handleCategoryPress = useCallback((category: CategoryFilter) => {
    void selection();
    setSelectedCategory((current) => (current === category ? "all" : category));
    setOpenRowId(null);
  }, []);

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

  const targetStyle = useMemo(
    () => [styles.target, { backgroundColor: colors.bg }],
    [colors.bg],
  );
  const screenTitleStyle = useMemo(
    () => [styles.screenTitle, { color: colors.text }],
    [colors.text],
  );
  const screenTotalStyle = useMemo(
    () => [styles.screenTotal, { color: colors.accent }],
    [colors.accent],
  );
  const listContentStyle = useMemo(
    () => [styles.listContent, { paddingBottom: bottomPadding }],
    [bottomPadding],
  );
  const snackbarBottomOffset = bottomPadding - spacing.xl;

  return (
    <BlurTargetView
      ref={isFocused ? blurTarget : undefined}
      style={targetStyle}
    >
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={styles.screenHeader}>
          <Text style={screenTitleStyle}>Expenses</Text>
          <Text style={screenTotalStyle}>{formatMoney(visibleTotalCents)}</Text>
        </View>
        <View style={styles.searchContainer}>
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
                onPress={() => handleCategoryPress(option.id)}
              />
            ))}
          </ScrollView>
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
        {snackbar ? (
          <Snackbar
            key={snackbar.id}
            message={snackbar.message}
            actionLabel="Undo"
            onAction={handleUndo}
            onDismiss={handleDismissSnackbar}
            bottomOffset={snackbarBottomOffset}
          />
        ) : null}
      </SafeAreaView>
    </BlurTargetView>
  );
}
