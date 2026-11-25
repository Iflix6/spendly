# Spendly

Spendly is a local-first expense tracker built with Expo and React Native. It focuses on fast daily entry, clear monthly budgets, and useful spending summaries without accounts, cloud services, or banking connections.

## Features

- Add and edit expenses with amount, category, date, and an optional 80-character note.
- Delete expenses with Undo, including swipe and accessibility actions.
- Browse expenses grouped by day with search and category filters.
- View monthly category totals in an interactive Skia donut chart.
- Explore weekly or daily spending in a Skia bar chart.
- Track a monthly budget with an animated, over-budget-aware ring.
- Choose light, dark, or system appearance.
- Persist expenses, budget, appearance, and seed state locally.
- Reset deterministic demo data from Settings.
- Respect reduced motion and expose accessible labels for charts and controls.

## Stack

- Expo SDK 58 and Expo Router
- React Native 0.88 and React 19
- TypeScript strict mode
- React Native Reanimated and Gesture Handler
- Skia for custom charts
- Zustand with AsyncStorage persistence
- date-fns and Expo DateTimePicker
- Expo Haptics, Blur, Linear Gradient, and Vector Icons
- Jest and React Native Testing Library

## Run locally

```bash
npm install
npx expo start
```

Then open the project in Expo Go or a development build. Platform shortcuts are also available:

```bash
npm run android
npm run ios
npm run web
```

Useful checks:

```bash
npm run typecheck
npm test
npx expo-doctor
```

## Project structure

```text
app/
  _layout.tsx
  (tabs)/
    _layout.tsx
    index.tsx
    expenses.tsx
    stats.tsx
  add.tsx
  expense/[id].tsx
src/
  components/
  constants/
  hooks/
  lib/
  store/
  theme/
docs/
  SPEC.md
```

## Data and design notes

- Money is stored as integer cents.
- Expense dates use local noon to avoid timezone day drift.
- The six categories and all theme colors are centralized in `src/constants` and `src/theme`.
- Spacing and radius values follow the locked design tokens.
- Theme surfaces interpolate on the UI thread; foreground colors switch at the animation midpoint to avoid low-contrast flashes.
- Reduced motion removes springs, sweeps, loops, and stagger.
- The detail transition measures the pressed row, category icon, and amount, then animates those elements into place. This manual fallback is used because native shared transitions are not enabled in the installed Reanimated build.
- Data stays on the device. There is no backend, authentication, sync, export, or multi-currency support.

## 60-second demo script

1. **0–10s:** Open Home and point out the monthly total, budget ring, and category cards.
2. **10–20s:** Tap the floating add button, enter an amount, choose a category, add a short note, and save.
3. **20–30s:** Open Expenses, search for the new note, change the category filter, and swipe a row to reveal Delete.
4. **30–40s:** Open the expense detail, show the full date and note, edit the amount, and return.
5. **40–50s:** Open Stats, switch between Week and Day, select a donut segment, and move between months.
6. **50–60s:** Open Settings, switch appearance, edit the budget, and show the persisted values after reopening the app.
