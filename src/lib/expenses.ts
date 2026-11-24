import { CATEGORY_BY_ID, type CategoryId } from "@/constants/categories";
import type { Expense } from "@/store/useExpenseStore";
import { dayLabel, localDateKey } from "./dates";

export type CategoryFilter = CategoryId | "all";

export interface ExpenseSection {
  key: string;
  title: string;
  totalCents: number;
  data: Expense[];
  startIndex: number;
}

export function filterExpenses(
  expenses: readonly Expense[],
  query: string,
  category: CategoryFilter,
): Expense[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  return expenses.filter((expense) => {
    if (category !== "all" && expense.categoryId !== category) {
      return false;
    }

    if (normalizedQuery.length === 0) {
      return true;
    }

    const categoryLabel = CATEGORY_BY_ID[expense.categoryId].label;
    return (
      expense.note.toLocaleLowerCase().includes(normalizedQuery) ||
      categoryLabel.toLocaleLowerCase().includes(normalizedQuery)
    );
  });
}

export function groupExpensesByDay(
  expenses: readonly Expense[],
  query: string,
  category: CategoryFilter,
): ExpenseSection[] {
  const filtered = filterExpenses(expenses, query, category).sort(
    (first, second) =>
      second.date.localeCompare(first.date) ||
      second.createdAt - first.createdAt,
  );
  const sections = new Map<string, ExpenseSection>();
  let itemIndex = 0;

  for (const expense of filtered) {
    const key = localDateKey(new Date(expense.date));
    const existing = sections.get(key);

    if (existing) {
      existing.data.push(expense);
      existing.totalCents += expense.amountCents;
    } else {
      sections.set(key, {
        key,
        title: dayLabel(new Date(expense.date)),
        totalCents: expense.amountCents,
        data: [expense],
        startIndex: itemIndex,
      });
    }

    itemIndex += 1;
  }

  return Array.from(sections.values());
}
