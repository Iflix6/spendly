import { Snackbar } from "@/components/Snackbar";
import { SwipeableRow } from "@/components/SwipeableRow";
import { SNACKBAR } from "@/constants/expenses";
import * as haptics from "@/lib/haptics";
import { useExpenseStore, type Expense } from "@/store/useExpenseStore";
import { ThemeProvider } from "@/theme/ThemeProvider";
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    jest,
} from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import type { ReactElement } from "react";

jest.mock("@expo/vector-icons/Ionicons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    __esModule: true,
    default: ({
      name,
      size,
      color,
    }: {
      name: string;
      size?: number;
      color?: string;
    }) => React.createElement(Text, { style: { fontSize: size, color } }, name),
  };
});

const expense: Expense = {
  id: "food-today",
  amountCents: 1250,
  categoryId: "food",
  date: "2026-10-12T12:00:00.000Z",
  note: "Lunch at Mama Put",
  createdAt: 300,
};

function renderWithTheme(screen: ReactElement) {
  return render(<ThemeProvider>{screen}</ThemeProvider>);
}

beforeEach(() => {
  useExpenseStore.setState({ themeMode: "light" });
  jest.spyOn(haptics, "lightImpact").mockResolvedValue(undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("SwipeableRow", () => {
  it("deletes from the revealed action with light haptic feedback", async () => {
    const onDelete = jest.fn();
    const { getByRole } = await renderWithTheme(
      <SwipeableRow
        expense={expense}
        isOpen
        initialRender={false}
        entranceIndex={0}
        onOpen={jest.fn()}
        onClose={jest.fn()}
        onDelete={onDelete}
        onPress={jest.fn()}
      />,
    );

    fireEvent.press(getByRole("button", { name: "Delete Food expense" }));

    expect(haptics.lightImpact).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(expense.id);
  });
});

describe("Snackbar", () => {
  it("runs undo and schedules dismissal after four seconds", async () => {
    const timeoutSpy = jest.spyOn(globalThis, "setTimeout");
    const onAction = jest.fn();
    const onDismiss = jest.fn();
    const { getByRole } = await renderWithTheme(
      <Snackbar
        message="Expense deleted"
        actionLabel="Undo"
        onAction={onAction}
        onDismiss={onDismiss}
        bottomOffset={100}
      />,
    );

    fireEvent.press(getByRole("button", { name: "Undo" }));
    expect(onAction).toHaveBeenCalledTimes(1);

    expect(timeoutSpy).toHaveBeenCalledWith(
      expect.any(Function),
      SNACKBAR.autoDismissMs,
    );
    const dismissCallback = timeoutSpy.mock.calls.find(
      (call) => call[1] === SNACKBAR.autoDismissMs,
    )?.[0];
    expect(typeof dismissCallback).toBe("function");

    if (typeof dismissCallback === "function") {
      dismissCallback();
    }
    expect(onDismiss).toHaveBeenCalledTimes(1);
    timeoutSpy.mockRestore();
  });
});
