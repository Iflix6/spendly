import { DEFAULT_BUDGET_CENTS } from "@/constants";
import type { CategoryId } from "@/constants/categories";
import { toNoonISO } from "@/lib/dates";
import {
    monthDelta,
    spendByDay,
    spendByWeek,
    totalForMonth,
    totalsByCategory,
} from "@/lib/stats";
import type { Expense } from "@/store/useExpenseStore";
import { describe, expect, it } from "@jest/globals";

const month = new Date(2026, 9, 15, 12);

function expense(
  id: string,
  date: Date,
  amountCents: number,
  categoryId: CategoryId = "food",
): Expense {
  return {
    id,
    date: toNoonISO(date),
    amountCents,
    categoryId,
    note: id,
    createdAt: 0,
  };
}

describe("stats", () => {
  it("returns empty aggregates and zero-filled chart buckets", () => {
    const emptyMonth = new Date(2026, 8, 15);
    expect(totalForMonth([], month)).toBe(0);
    expect(totalsByCategory([], month)).toEqual({
      food: 0,
      transport: 0,
      shopping: 0,
      bills: 0,
      fun: 0,
      health: 0,
    });
    expect(spendByDay([], emptyMonth)).toHaveLength(30);
    expect(
      spendByDay([], emptyMonth).every((day) => day.amountCents === 0),
    ).toBe(true);
    expect(spendByWeek([], month)).toEqual([
      { bucket: 0, amountCents: 0 },
      { bucket: 1, amountCents: 0 },
      { bucket: 2, amountCents: 0 },
      { bucket: 3, amountCents: 0 },
      { bucket: 4, amountCents: 0 },
    ]);
  });

  it("aggregates monthly and category totals", () => {
    const expenses = [
      expense("one", new Date(2026, 9, 1), 100),
      expense("two", new Date(2026, 9, 31), 200, "transport"),
      expense("old", new Date(2026, 8, 30), 999, "shopping"),
    ];
    expect(totalForMonth(expenses, month)).toBe(300);
    expect(totalsByCategory(expenses, month)).toEqual({
      food: 100,
      transport: 200,
      shopping: 0,
      bills: 0,
      fun: 0,
      health: 0,
    });
  });

  it("aggregates multiple expenses on the same day", () => {
    const expenses = [
      expense("one", new Date(2026, 9, 1), 100),
      expense("two", new Date(2026, 9, 1), 200),
      expense("three", new Date(2026, 9, 1), 50, "transport"),
      expense("last", new Date(2026, 9, 31), 75, "health"),
    ];
    const days = spendByDay(expenses, month);
    expect(days).toHaveLength(31);
    expect(days[0]).toEqual({ date: "2026-10-01", amountCents: 350 });
    expect(days[30]).toEqual({ date: "2026-10-31", amountCents: 75 });
    expect(days[15].amountCents).toBe(0);
  });

  it("uses the five fixed week buckets", () => {
    const expenses = [
      expense("d7", new Date(2026, 9, 7), 10),
      expense("d8", new Date(2026, 9, 8), 20),
      expense("d14", new Date(2026, 9, 14), 30),
      expense("d15", new Date(2026, 9, 15), 40),
      expense("d21", new Date(2026, 9, 21), 50),
      expense("d22", new Date(2026, 9, 22), 60),
      expense("d28", new Date(2026, 9, 28), 70),
      expense("d29", new Date(2026, 9, 29), 80),
      expense("d31", new Date(2026, 9, 31), 90),
    ];
    expect(
      spendByWeek(expenses, month).map((week) => week.amountCents),
    ).toEqual([10, 50, 90, 130, 170]);
  });

  it("calculates month-over-month change and rounds to one decimal", () => {
    const expenses = [
      expense("current", new Date(2026, 9, 5), 150),
      expense("previous", new Date(2026, 8, 5), 100),
    ];
    expect(monthDelta(expenses, month)).toBe(50);
    expect(monthDelta([expenses[1]], month)).toBe(-100);
    expect(
      monthDelta(
        [
          expense("current", new Date(2026, 9, 5), 100),
          expense("previous", new Date(2026, 8, 5), 300),
        ],
        month,
      ),
    ).toBe(-66.7);
  });

  it("is safe when the previous month has no spending", () => {
    expect(monthDelta([], month)).toBe(0);
    expect(
      monthDelta([expense("current", new Date(2026, 9, 5), 100)], month),
    ).toBe(100);
  });

  it("reports totals above the default budget", () => {
    const expenses = [
      expense("large", new Date(2026, 9, 5), DEFAULT_BUDGET_CENTS + 1),
    ];
    expect(totalForMonth(expenses, month)).toBeGreaterThan(
      DEFAULT_BUDGET_CENTS,
    );
    expect(totalForMonth(expenses, month)).toBe(DEFAULT_BUDGET_CENTS + 1);
  });

  it.each([
    [new Date(2024, 1, 15), 29],
    [new Date(2026, 1, 15), 28],
    [new Date(2026, 3, 15), 30],
    [new Date(2026, 11, 15), 31],
  ])("creates the right number of daily bars for %s", (date, expectedDays) => {
    expect(spendByDay([], date)).toHaveLength(expectedDays);
  });
});
