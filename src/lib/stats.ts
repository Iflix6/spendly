import { addDays, format, getDaysInMonth, subMonths } from 'date-fns';
import { PERCENT_PRECISION, WEEK_BUCKET_BOUNDARIES } from '@/constants';
import { CATEGORY_IDS, type CategoryId } from '@/constants/categories';
import type { Expense } from '@/store/useExpenseStore';
import { isSameMonth, localDateKey, weekBucket } from './dates';

export interface DaySpend {
  date: string;
  amountCents: number;
}

export interface WeekSpend {
  bucket: number;
  amountCents: number;
}

export function totalForMonth(expenses: readonly Expense[], month: Date): number {
  return expenses.reduce(
    (total, expense) =>
      isSameMonth(new Date(expense.date), month)
        ? total + expense.amountCents
        : total,
    0
  );
}

export function totalsByCategory(
  expenses: readonly Expense[],
  month: Date
): Record<CategoryId, number> {
  const totals = CATEGORY_IDS.reduce(
    (result, categoryId) => {
      result[categoryId] = 0;
      return result;
    },
    {} as Record<CategoryId, number>
  );

  for (const expense of expenses) {
    if (isSameMonth(new Date(expense.date), month)) {
      totals[expense.categoryId] += expense.amountCents;
    }
  }
  return totals;
}

export function spendByDay(
  expenses: readonly Expense[],
  month: Date
): DaySpend[] {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const days = Array.from({ length: getDaysInMonth(month) }, (_, index) => {
    const date = addDays(start, index);
    return { date: localDateKey(date), amountCents: 0 };
  });
  const byDate = new Map(days.map((day) => [day.date, day]));

  for (const expense of expenses) {
    const date = new Date(expense.date);
    const key = localDateKey(date);
    const day = byDate.get(key);
    if (day && isSameMonth(date, month)) {
      day.amountCents += expense.amountCents;
    }
  }
  return days;
}

export function spendByWeek(
  expenses: readonly Expense[],
  month: Date
): WeekSpend[] {
  const weeks: WeekSpend[] = Array.from(
    { length: WEEK_BUCKET_BOUNDARIES.length + 1 },
    (_, bucket) => ({ bucket, amountCents: 0 })
  );

  for (const expense of expenses) {
    const date = new Date(expense.date);
    if (isSameMonth(date, month)) {
      const bucket = weekBucket(date.getDate());
      weeks[bucket].amountCents += expense.amountCents;
    }
  }
  return weeks;
}

export function monthDelta(
  expenses: readonly Expense[],
  month: Date
): number {
  const current = totalForMonth(expenses, month);
  const previous = totalForMonth(expenses, subMonths(month, 1));
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  const delta = ((current - previous) / previous) * 100;
  const precision = 10 ** PERCENT_PRECISION;
  return Math.round(delta * precision) / precision;
}

export function monthlyDateLabel(month: Date): string {
  return format(month, 'MMMM yyyy');
}
