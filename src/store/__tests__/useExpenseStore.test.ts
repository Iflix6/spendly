import {
    DEFAULT_BUDGET_CENTS,
    DEFAULT_THEME_MODE,
    STORE_KEY,
    STORE_VERSION,
} from "@/constants";
import { toNoonISO } from "@/lib/dates";
import { useExpenseStore } from "@/store/useExpenseStore";
import { beforeEach, describe, expect, it } from "@jest/globals";
import AsyncStorage from "@react-native-async-storage/async-storage";

const input = {
  amountCents: 1250,
  categoryId: "food" as const,
  date: toNoonISO(new Date(2026, 10, 23, 12)),
  note: "Lunch",
};

beforeEach(async () => {
  await AsyncStorage.clear();
  useExpenseStore.setState({
    expenses: [],
    budgetCents: DEFAULT_BUDGET_CENTS,
    themeMode: "system",
    hasSeeded: false,
    lastDeleted: null,
  });
  await useExpenseStore.persist.rehydrate();
});

describe("useExpenseStore", () => {
  it("adds, updates, deletes, and restores an expense", () => {
    const added = useExpenseStore.getState().addExpense(input);
    const seededCount = useExpenseStore.getState().expenses.length - 1;
    expect(added.id).toMatch(/^[a-z0-9]+-[a-z0-9]+$/);
    expect(added.createdAt).toEqual(expect.any(Number));

    useExpenseStore.getState().updateExpense(added.id, { amountCents: 1500 });
    expect(useExpenseStore.getState().expenses[0].amountCents).toBe(1500);

    useExpenseStore.getState().deleteExpense(added.id);
    expect(useExpenseStore.getState().expenses).toHaveLength(seededCount);
    expect(useExpenseStore.getState().lastDeleted?.id).toBe(added.id);

    useExpenseStore.getState().undoDelete();
    expect(useExpenseStore.getState().expenses).toHaveLength(seededCount + 1);
    expect(useExpenseStore.getState().expenses[0].id).toBe(added.id);
    expect(useExpenseStore.getState().lastDeleted).toBeNull();
  });

  it("seeds once after rehydration and does not duplicate on reload", async () => {
    expect(useExpenseStore.getState().hasSeeded).toBe(true);
    const seeded = useExpenseStore.getState().expenses;
    expect(seeded.length).toBeGreaterThan(0);
    expect(await AsyncStorage.getItem(STORE_KEY)).not.toBeNull();

    await useExpenseStore.persist.rehydrate();
    expect(useExpenseStore.getState().expenses).toEqual(seeded);
    expect(useExpenseStore.getState().expenses).toHaveLength(seeded.length);
  });

  it("persists theme and budget changes", async () => {
    useExpenseStore.getState().setThemeMode("dark");
    useExpenseStore.getState().setBudget(200000);
    await useExpenseStore.persist.rehydrate();
    expect(useExpenseStore.getState().themeMode).toBe("dark");
    expect(useExpenseStore.getState().budgetCents).toBe(200000);
  });

  it("migrates the old appearance without losing financial data", async () => {
    const expense = {
      ...input,
      id: "persisted-expense",
      createdAt: Date.now(),
    };
    const lastDeleted = {
      ...input,
      id: "deleted-expense",
      note: "Deleted lunch",
      createdAt: Date.now(),
    };
    await AsyncStorage.setItem(
      STORE_KEY,
      JSON.stringify({
        state: {
          expenses: [expense],
          budgetCents: 250000,
          themeMode: "dark",
          hasSeeded: true,
          lastDeleted,
        },
        version: STORE_VERSION - 1,
      }),
    );

    await useExpenseStore.persist.rehydrate();

    expect(useExpenseStore.getState().themeMode).toBe(DEFAULT_THEME_MODE);
    expect(useExpenseStore.getState().budgetCents).toBe(250000);
    expect(useExpenseStore.getState().expenses).toEqual([expense]);
    expect(useExpenseStore.getState().lastDeleted).toEqual(lastDeleted);
    expect(useExpenseStore.getState().hasSeeded).toBe(true);
  });
});
