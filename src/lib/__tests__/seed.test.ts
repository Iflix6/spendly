import { describe, expect, it } from '@jest/globals';
import { DEFAULT_BUDGET_CENTS, NOTE_MAX } from '@/constants';
import {
  CATEGORY_IDS,
  CATEGORY_SPEND_RANGES,
  FIXED_MONTHLY_BILLS,
} from '@/constants/categories';
import { isSameMonth, toNoonISO } from '@/lib/dates';
import { generateSeed } from '@/lib/seed';
import { totalForMonth } from '@/lib/stats';

describe('seed', () => {
  it('is deterministic for the same reference date', () => {
    const today = new Date(2026, 10, 23, 12);
    expect(generateSeed(today)).toEqual(generateSeed(new Date(today)));
  });

  it('creates about 70 unique expenses across all categories', () => {
    const expenses = generateSeed(new Date(2026, 10, 23, 12));
    expect(expenses.length).toBeGreaterThanOrEqual(65);
    expect(expenses.length).toBeLessThanOrEqual(75);
    expect(new Set(expenses.map((item) => item.id)).size).toBe(expenses.length);
    expect(new Set(expenses.map((item) => item.categoryId))).toEqual(new Set(CATEGORY_IDS));
    expect(expenses.every((item) => item.note.length <= NOTE_MAX)).toBe(true);
  });

  it.each([
    new Date(2026, 9, 15, 12),
    new Date(2026, 10, 23, 12),
    new Date(2026, 11, 31, 12),
  ])('keeps mature current-month spending near 75 percent of budget on %s', (today) => {
    const expenses = generateSeed(today);
    const total = totalForMonth(expenses, today);
    expect(total / DEFAULT_BUDGET_CENTS).toBeGreaterThanOrEqual(0.7);
    expect(total / DEFAULT_BUDGET_CENTS).toBeLessThanOrEqual(0.8);
  });

  it('makes the previous full month slightly higher after day 15', () => {
    const today = new Date(2026, 10, 23, 12);
    const expenses = generateSeed(today);
    const previousMonth = new Date(2026, 9, 15, 12);
    expect(totalForMonth(expenses, previousMonth)).toBeGreaterThan(
      totalForMonth(expenses, today)
    );
  });

  it('handles leap-year and 30/31-day month boundaries without future dates', () => {
    for (const today of [
      new Date(2024, 2, 1, 12),
      new Date(2026, 3, 30, 12),
      new Date(2026, 11, 31, 12),
    ]) {
      const expenses = generateSeed(today);
      const current = expenses.filter((item) => isSameMonth(new Date(item.date), today));
      const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const previous = expenses.filter((item) =>
        isSameMonth(new Date(item.date), previousMonth)
      );
      expect(current.length).toBeGreaterThan(0);
      expect(previous.length).toBeGreaterThan(0);
      expect(current.every((item) => new Date(item.date) <= today)).toBe(true);
    }
  });

  it('keeps every generated amount inside its category range', () => {
    const expenses = generateSeed(new Date(2026, 10, 23, 12));
    for (const item of expenses) {
      const range = CATEGORY_SPEND_RANGES[item.categoryId];
      expect(item.amountCents).toBeGreaterThanOrEqual(range.minCents);
      expect(item.amountCents).toBeLessThanOrEqual(range.maxCents);
    }
  });

  it('includes the same fixed monthly bills in both mature months', () => {
    const today = new Date(2026, 10, 23, 12);
    const expenses = generateSeed(today);
    const previousMonth = new Date(2026, 9, 15, 12);
    for (const bill of FIXED_MONTHLY_BILLS) {
      const matches = expenses.filter((item) => item.note === bill.note);
      const currentMatch = matches.find((item) => isSameMonth(new Date(item.date), today));
      const previousMatch = matches.find((item) =>
        isSameMonth(new Date(item.date), previousMonth)
      );
      expect(currentMatch?.amountCents).toBe(bill.amountCents);
      expect(previousMatch?.amountCents).toBe(bill.amountCents);
      expect(currentMatch?.date).toBe(
        toNoonISO(new Date(today.getFullYear(), today.getMonth(), bill.day, 12))
      );
    }
  });
});
