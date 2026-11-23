# Spendly — Project Spec

## Scope (LOCKED)

IN: add/edit/delete expenses, grouped list with search + category filter, fixed categories, monthly stats (donut + bar chart), one monthly budget with animated ring, light/dark/system theme, deterministic seed data.
OUT (never build or stub): backend, auth, cloud sync, AI, bank/real money, multi-currency, accounts, receipt scanning, recurring expenses, notifications, export, analytics, Lottie or external asset files.
Rules: no features beyond this list; do not ask questions, state assumptions in the final report; surgical changes only; one component per file; no `any`; no TODOs or placeholders; no hardcoded colors outside theme/category constants; no magic numbers outside src/theme and src/constants.

## Stack (LOCKED)

Expo (latest stable SDK) + TypeScript strict + Expo Router; react-native-reanimated + gesture-handler; @shopify/react-native-skia for all custom charts/drawing (no chart library); Zustand + persist + AsyncStorage (Expo Go compatible, no MMKV); date-fns; @react-native-community/datetimepicker; expo-haptics, expo-blur, expo-linear-gradient; @expo/vector-icons; Inter via @expo-google-fonts/inter. Install with `npx expo install`.

## Data model (LOCKED)

Money = integer cents. `CURRENCY_SYMBOL = "$"` in src/constants.

```ts
type CategoryId =
  | "food"
  | "transport"
  | "shopping"
  | "bills"
  | "fun"
  | "health";
interface Expense {
  id: string;
  amountCents: number;
  categoryId: CategoryId;
  date: string; // ISO, local day at 12:00 to avoid TZ drift
  note: string; // max 80 chars, may be empty
  createdAt: number; // epoch ms
}
interface ExpenseState {
  expenses: Expense[];
  budgetCents: number; // default 150000
  themeMode: "system" | "light" | "dark";
  hasSeeded: boolean;
  lastDeleted: Expense | null;
  addExpense(e: Omit<Expense, "id" | "createdAt">): Expense;
  updateExpense(
    id: string,
    patch: Partial<Omit<Expense, "id" | "createdAt">>,
  ): void;
  deleteExpense(id: string): void;
  undoDelete(): void;
  setBudget(cents: number): void;
  setThemeMode(m: ExpenseState["themeMode"]): void;
  resetDemoData(): void;
}
```

Categories: food "Food" #FF8A5B; transport "Transport" #4D9DE0; shopping "Shopping" #B779E8; bills "Bills" #F5B83D; fun "Fun" #FF5D8F; health "Health" #3DCB8F. Feather/Ionicons icons.

## Design system (LOCKED)

Accent #6C5CE7; success #34C98B; warning #F5B83D; danger #FF5C5C.
Light: bg #F6F7FB, surface #FFFFFF, surfaceAlt #EEF0F6, border #E3E6EE, text #11131A, textMuted #6B7280.
Dark: bg #0B0D12, surface #151922, surfaceAlt #1D2230, border #262C3B, text #F2F4F8, textMuted #9AA3B2.
Spacing 4/8/12/16/20/24/32. Radii: 12 inputs/chips, 20 cards, 28 sheets, 999 pills.
Type: Inter 400/500/600/700; numbers use tabular-nums. Scale: display 40/44, title 24/30, headline 18/24, body 15/22, caption 12/16.
Cards: radius 20; soft shadow in light, 1px border (no shadow) in dark. Category icon: 40px circle tinted with category color at 15% opacity, icon in full color. Safe areas on every screen; min touch target 44x44. Theme switch animates colors via a themeProgress shared value + interpolateColor (300ms), no white flash.

## Motion (LOCKED), src/theme/motion.ts

Springs: snappy {damping 18, stiffness 220, mass 1}; soft {20, 140, 1}; bouncy {12, 200, 1}.
Durations: fast 150, base 250, slow 400, chart 900 (ms). Entrance easing bezier(0.2, 0.8, 0.2, 1); other: Easing.out(Easing.cubic).
Rules: animate transform/opacity where possible; all animation on the UI thread (worklets); no JS timers for motion; nothing longer than 400ms except charts (900ms) and the looping empty-state float.
Reduced motion: `useReducedMotionSafe()` wraps Reanimated `useReducedMotion`; when on, no springs/stagger/sweeps/loops, only 0-120ms opacity fades.
Haptics via src/lib/haptics.ts (no-op if unsupported): selection (tabs, chips, keypad), light impact (FAB, buttons), success (save), warning (invalid input, delete).

## Structure

```
app/ _layout.tsx; (tabs)/_layout.tsx, index.tsx, expenses.tsx, stats.tsx; add.tsx (transparentModal, ?id= edit); expense/[id].tsx
src/ constants/ theme/ store/ lib/ (money, dates, seed, stats, haptics) components/ hooks/
components/: AnimatedNumber BudgetRing DonutChart BarChart ExpenseRow SwipeableRow CategoryChip CategoryIcon NumberPad BottomSheet Snackbar FloatingTabBar Fab SearchBar EmptyState SectionHeader Card SettingsSheet
```

## Quality bars

60fps on mid-range Android (React.memo rows, stable keys, useCallback/useMemo, no inline style objects in list items). No yellow boxes/warnings. Every pressable has accessibilityRole + accessibilityLabel; AA contrast in both themes; layouts survive 1.3x font scale. After each phase: `npx tsc --noEmit` and `npx jest` must pass.
