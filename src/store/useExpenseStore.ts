import {
    DEFAULT_BUDGET_CENTS,
    DEFAULT_THEME_MODE,
    ID_RADIX,
    ID_RANDOM_LENGTH,
    NOTE_MAX,
    STORE_KEY,
    STORE_VERSION,
} from "@/constants";
import type { CategoryId } from "@/constants/categories";
import { generateSeed } from "@/lib/seed";
import type { ThemeMode } from "@/theme/ThemeProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface Expense {
  id: string;
  amountCents: number;
  categoryId: CategoryId;
  date: string;
  note: string;
  createdAt: number;
}

export type ExpenseInput = Omit<Expense, "id" | "createdAt">;

type PersistedExpenseState = Pick<
  ExpenseState,
  "expenses" | "budgetCents" | "themeMode" | "hasSeeded" | "lastDeleted"
>;

export interface ExpenseState {
  expenses: Expense[];
  budgetCents: number;
  themeMode: ThemeMode;
  hasSeeded: boolean;
  lastDeleted: Expense | null;
  addExpense: (expense: ExpenseInput) => Expense;
  updateExpense: (
    id: string,
    patch: Partial<Omit<Expense, "id" | "createdAt">>,
  ) => void;
  deleteExpense: (id: string) => void;
  undoDelete: () => void;
  setBudget: (cents: number) => void;
  setThemeMode: (mode: ExpenseState["themeMode"]) => void;
  resetDemoData: () => void;
}

function generateLocalId(): string {
  const timestamp = Date.now().toString(ID_RADIX);
  const random = Math.random()
    .toString(ID_RADIX)
    .slice(2, 2 + ID_RANDOM_LENGTH);
  return `${timestamp}-${random}`;
}

export const useExpenseStore = create<ExpenseState>()(
  persist<ExpenseState, [], [], PersistedExpenseState>(
    (set) => ({
      expenses: [],
      budgetCents: DEFAULT_BUDGET_CENTS,
      themeMode: DEFAULT_THEME_MODE,
      hasSeeded: false,
      lastDeleted: null,
      addExpense: (input) => {
        const expense: Expense = {
          ...input,
          id: generateLocalId(),
          createdAt: Date.now(),
          amountCents: Math.round(input.amountCents),
          note: input.note.slice(0, NOTE_MAX),
        };
        set((state) => ({ expenses: [expense, ...state.expenses] }));
        return expense;
      },
      updateExpense: (id, patch) => {
        set((state) => ({
          expenses: state.expenses.map((expense) => {
            if (expense.id !== id) {
              return expense;
            }
            return {
              ...expense,
              ...patch,
              id: expense.id,
              createdAt: expense.createdAt,
              amountCents:
                patch.amountCents === undefined
                  ? expense.amountCents
                  : Math.round(patch.amountCents),
              note:
                patch.note === undefined
                  ? expense.note
                  : patch.note.slice(0, NOTE_MAX),
            };
          }),
        }));
      },
      deleteExpense: (id) => {
        set((state) => {
          const deleted = state.expenses.find((expense) => expense.id === id);
          if (!deleted) {
            return state;
          }
          return {
            expenses: state.expenses.filter((expense) => expense.id !== id),
            lastDeleted: deleted,
          };
        });
      },
      undoDelete: () => {
        set((state) => {
          if (!state.lastDeleted) {
            return state;
          }
          const restored = state.lastDeleted;
          const expenses = state.expenses.some(
            (expense) => expense.id === restored.id,
          )
            ? state.expenses
            : [restored, ...state.expenses];
          return { expenses, lastDeleted: null };
        });
      },
      setBudget: (cents) => {
        set({ budgetCents: Math.max(0, Math.round(cents)) });
      },
      setThemeMode: (themeMode) => {
        set({ themeMode });
      },
      resetDemoData: () => {
        set({
          expenses: generateSeed(new Date()),
          budgetCents: DEFAULT_BUDGET_CENTS,
          hasSeeded: true,
          lastDeleted: null,
        });
      },
    }),
    {
      name: STORE_KEY,
      version: STORE_VERSION,
      migrate: (persistedState) => {
        const state = persistedState as Partial<PersistedExpenseState>;
        return {
          expenses: Array.isArray(state.expenses) ? state.expenses : [],
          budgetCents:
            typeof state.budgetCents === "number"
              ? state.budgetCents
              : DEFAULT_BUDGET_CENTS,
          themeMode: DEFAULT_THEME_MODE,
          hasSeeded: state.hasSeeded === true,
          lastDeleted: state.lastDeleted ?? null,
        };
      },
      storage: createJSONStorage<PersistedExpenseState>(() => AsyncStorage),
      partialize: (state) => ({
        expenses: state.expenses,
        budgetCents: state.budgetCents,
        themeMode: state.themeMode,
        hasSeeded: state.hasSeeded,
        lastDeleted: state.lastDeleted,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && !state.hasSeeded) {
          useExpenseStore.setState({
            expenses: generateSeed(new Date()),
            hasSeeded: true,
          });
        }
      },
    },
  ),
);
