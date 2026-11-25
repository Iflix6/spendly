import {
    categoryFilterFromParam,
    filterExpenses,
    groupExpensesByDay,
} from "@/lib/expenses";
import type { Expense } from "@/store/useExpenseStore";
import { describe, expect, it } from "@jest/globals";

const expenses: Expense[] = [
  {
    id: "food-today",
    amountCents: 1250,
    categoryId: "food",
    date: "2026-10-12T12:00:00.000Z",
    note: "Lunch at Mama Put",
    createdAt: 300,
  },
  {
    id: "transport-today",
    amountCents: 600,
    categoryId: "transport",
    date: "2026-10-12T12:00:00.000Z",
    note: "Bolt ride",
    createdAt: 200,
  },
  {
    id: "shopping-yesterday",
    amountCents: 4200,
    categoryId: "shopping",
    date: "2026-10-11T12:00:00.000Z",
    note: "New sneakers",
    createdAt: 100,
  },
];

describe("category route parameters", () => {
  it("accepts a valid category", () => {
    expect(categoryFilterFromParam("food")).toBe("food");
    expect(categoryFilterFromParam("transport")).toBe("transport");
  });

  it("uses the first value when the router supplies an array", () => {
    expect(categoryFilterFromParam(["shopping", "food"])).toBe("shopping");
  });

  it("falls back to All for unsupported or malformed values", () => {
    expect(categoryFilterFromParam("all")).toBe("all");
    expect(categoryFilterFromParam("invalid")).toBe("all");
    expect(categoryFilterFromParam(undefined)).toBe("all");
    expect(categoryFilterFromParam(12)).toBe("all");
    expect(categoryFilterFromParam([])).toBe("all");
  });
});

describe("expense filtering", () => {
  it("matches note text case-insensitively", () => {
    expect(
      filterExpenses(expenses, "LUNCH", "all").map(({ id }) => id),
    ).toEqual(["food-today"]);
  });

  it("matches category labels case-insensitively", () => {
    expect(
      filterExpenses(expenses, "shopping", "all").map(({ id }) => id),
    ).toEqual(["shopping-yesterday"]);
  });

  it("combines the search query and category with AND", () => {
    expect(
      filterExpenses(expenses, "ride", "food").map(({ id }) => id),
    ).toEqual([]);
    expect(
      filterExpenses(expenses, "ride", "transport").map(({ id }) => id),
    ).toEqual(["transport-today"]);
  });

  it("returns every category for a blank query", () => {
    expect(filterExpenses(expenses, "   ", "all")).toHaveLength(3);
  });
});

describe("expense grouping", () => {
  it("groups by local day, totals each section, and sorts newest first", () => {
    const sections = groupExpensesByDay(expenses, "", "all");

    expect(sections.map(({ key }) => key)).toEqual([
      "2026-10-12",
      "2026-10-11",
    ]);
    expect(sections[0]?.totalCents).toBe(1850);
    expect(sections[1]?.totalCents).toBe(4200);
    expect(sections[0]?.data.map(({ id }) => id)).toEqual([
      "food-today",
      "transport-today",
    ]);
  });

  it("tracks global row positions for the initial stagger", () => {
    const sections = groupExpensesByDay(expenses, "", "all");

    expect(sections[0]?.startIndex).toBe(0);
    expect(sections[1]?.startIndex).toBe(2);
  });

  it("does not mutate the source collection", () => {
    const originalOrder = expenses.map(({ id }) => id);
    groupExpensesByDay(expenses, "", "all");

    expect(expenses.map(({ id }) => id)).toEqual(originalOrder);
  });
});
