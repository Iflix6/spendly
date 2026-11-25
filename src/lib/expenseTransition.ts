export interface ExpenseElementRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExpenseTransitionOrigin {
  row: ExpenseElementRect;
  icon: ExpenseElementRect;
  amount: ExpenseElementRect;
}

export interface MeasurableNativeView {
  measureInWindow: (
    callback: (x: number, y: number, width: number, height: number) => void,
  ) => void;
}

let pendingTransition:
  | { expenseId: string; origin: ExpenseTransitionOrigin }
  | undefined;

export function rememberExpenseTransition(
  expenseId: string,
  origin: ExpenseTransitionOrigin,
): void {
  pendingTransition = { expenseId, origin };
}

export function takeExpenseTransition(
  expenseId: string,
): ExpenseTransitionOrigin | null {
  if (pendingTransition?.expenseId !== expenseId) {
    return null;
  }

  const origin = pendingTransition.origin;
  pendingTransition = undefined;
  return origin;
}

export function measureExpenseElement(
  view: MeasurableNativeView | null,
): Promise<ExpenseElementRect | null> {
  if (!view) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    view.measureInWindow((x, y, width, height) => {
      resolve({ x, y, width, height });
    });
  });
}

export function measureExpenseRowTransition(
  row: MeasurableNativeView | null,
  icon: MeasurableNativeView | null,
  amount: MeasurableNativeView | null,
): Promise<ExpenseTransitionOrigin | null> {
  if (!row || !icon || !amount) {
    return Promise.resolve(null);
  }

  return Promise.all([
    measureExpenseElement(row),
    measureExpenseElement(icon),
    measureExpenseElement(amount),
  ]).then(([rowRect, iconRect, amountRect]) => {
    if (!rowRect || !iconRect || !amountRect) {
      return null;
    }

    return { row: rowRect, icon: iconRect, amount: amountRect };
  });
}
