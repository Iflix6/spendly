import { SheetOpenProgressProvider } from "@/components/SheetOpenProgressProvider";
import { SnackbarProvider } from "@/components/SnackbarProvider";
import { DELETE_CONFIRM } from "@/constants/expenseForm";
import { localDateKey, toNoonISO } from "@/lib/dates";
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
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AddExpenseScreen from "../add";

jest.setTimeout(15000);

const mockBack = jest.fn();
let mockParams: { id?: string } = {};

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ back: mockBack }),
}));

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

jest.mock("@react-native-community/datetimepicker", () => {
  const React = require("react");
  const { Pressable, Text, View } = require("react-native");
  const selectedDate = new Date(2026, 9, 10, 15, 0, 0);

  return {
    __esModule: true,
    default: ({
      onValueChange,
      onDismiss,
    }: {
      onValueChange: (
        event: { nativeEvent: { timestamp: number; utcOffset: number } },
        date: Date,
      ) => void;
      onDismiss: () => void;
    }) =>
      React.createElement(
        View,
        { testID: "expense-date-picker" },
        React.createElement(
          Pressable,
          {
            accessibilityRole: "button",
            accessibilityLabel: "Select test date",
            onPress: () =>
              onValueChange(
                {
                  nativeEvent: {
                    timestamp: selectedDate.getTime(),
                    utcOffset: 0,
                  },
                },
                selectedDate,
              ),
          },
          React.createElement(Text, null, "Select test date"),
        ),
        React.createElement(
          Pressable,
          {
            accessibilityRole: "button",
            accessibilityLabel: "Dismiss date picker",
            onPress: onDismiss,
          },
          React.createElement(Text, null, "Dismiss date picker"),
        ),
      ),
  };
});

const safeAreaMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const editableExpense: Expense = {
  id: "edit-expense",
  amountCents: 1250,
  categoryId: "shopping",
  date: toNoonISO(new Date(2026, 9, 10)),
  note: "Weekend groceries",
  createdAt: 100,
};

async function renderScreen() {
  return render(
    <SafeAreaProvider initialMetrics={safeAreaMetrics}>
      <ThemeProvider>
        <SheetOpenProgressProvider>
          <SnackbarProvider>
            <AddExpenseScreen />
          </SnackbarProvider>
        </SheetOpenProgressProvider>
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

async function enterAmount(
  press: (key: string) => Promise<void>,
  keys: readonly string[],
) {
  for (const key of keys) {
    await press(`keypad-${key}`);
  }
}

beforeEach(() => {
  mockParams = {};
  mockBack.mockClear();
  useExpenseStore.setState({
    expenses: [],
    themeMode: "light",
    lastDeleted: null,
  });
  jest.spyOn(haptics, "selection").mockResolvedValue(undefined);
  jest.spyOn(haptics, "success").mockResolvedValue(undefined);
  jest.spyOn(haptics, "warning").mockResolvedValue(undefined);
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe("Add expense screen", () => {
  it("handles leading zero and rejects a third decimal", async () => {
    const { getByRole, getByTestId } = await renderScreen();
    const press = async (testId: string) => {
      await fireEvent.press(getByTestId(testId));
    };

    expect(
      getByRole("button", { name: "Save expense" }).props.accessibilityState,
    ).toEqual({ disabled: true, busy: false });

    await enterAmount(press, ["0", "5", ".", "1", "2"]);
    expect(getByTestId("amount-display").props.children).toBe("5.12");

    await enterAmount(press, ["3"]);
    expect(getByTestId("amount-display").props.children).toBe("5.12");
    expect(haptics.warning).toHaveBeenCalledTimes(1);
  });

  it("clears the amount after a long backspace press", async () => {
    const { getByRole, getByTestId } = await renderScreen();

    await enterAmount(
      async (testId) => {
        await fireEvent.press(getByTestId(testId));
      },
      ["1", "2"],
    );
    await fireEvent(getByTestId("keypad-backspace"), "longPress");

    expect(getByTestId("amount-display").props.children).toBe("0");
    expect(
      getByRole("button", { name: "Save expense" }).props.accessibilityState,
    ).toEqual({ disabled: true, busy: false });
  });

  it("creates an expense and dismisses after the save animation", async () => {
    const { getByLabelText, getByRole, getByTestId } = await renderScreen();
    const press = async (testId: string) => {
      await fireEvent.press(getByTestId(testId));
    };

    await enterAmount(press, ["1", "2", ".", "3", "4"]);
    await fireEvent.press(getByRole("button", { name: "Transport" }));
    await fireEvent.changeText(getByLabelText("Note"), "Airport taxi");
    await fireEvent.press(getByRole("button", { name: "Save expense" }));

    const created = useExpenseStore.getState().expenses[0];
    expect(created).toMatchObject({
      amountCents: 1234,
      categoryId: "transport",
      note: "Airport taxi",
    });
    expect(localDateKey(new Date(created.date))).toBe(localDateKey(new Date()));
    expect(haptics.success).toHaveBeenCalledTimes(1);
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("prefills and updates an existing expense", async () => {
    mockParams = { id: editableExpense.id };
    useExpenseStore.setState({ expenses: [editableExpense] });
    const { getByLabelText, getByRole, getByTestId, getByText } =
      await renderScreen();

    expect(getByText("Edit expense")).toBeTruthy();
    expect(getByTestId("amount-display").props.children).toBe("12.5");
    expect(getByLabelText("Note").props.value).toBe("Weekend groceries");
    expect(
      getByRole("button", { name: "Shopping" }).props.accessibilityState,
    ).toEqual({ selected: true });
    expect(
      getByRole("button", { name: "Pick date" }).props.accessibilityState,
    ).toEqual({ selected: true });

    await fireEvent(getByTestId("keypad-backspace"), "longPress");
    await enterAmount(
      async (testId) => {
        await fireEvent.press(getByTestId(testId));
      },
      ["2", "0"],
    );
    await fireEvent.changeText(getByLabelText("Note"), "Updated note");
    await fireEvent.press(getByRole("button", { name: "Save expense" }));

    expect(useExpenseStore.getState().expenses).toHaveLength(1);
    expect(useExpenseStore.getState().expenses[0]).toMatchObject({
      id: editableExpense.id,
      amountCents: 2000,
      note: "Updated note",
    });
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("stores a native picker selection at local noon", async () => {
    const { getByRole, getByTestId } = await renderScreen();

    await fireEvent.press(getByTestId("keypad-1"));
    await fireEvent.press(getByRole("button", { name: "Pick date" }));
    await fireEvent.press(getByRole("button", { name: "Select test date" }));
    await fireEvent.press(getByRole("button", { name: "Save expense" }));

    expect(useExpenseStore.getState().expenses[0].date).toBe(
      toNoonISO(new Date(2026, 9, 10, 15, 0, 0)),
    );
  });

  it("dismisses when the edit id no longer exists", async () => {
    mockParams = { id: "missing-expense" };

    await renderScreen();

    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
  });

  it("requires a second delete tap and restores the expense with Undo", async () => {
    mockParams = { id: editableExpense.id };
    useExpenseStore.setState({ expenses: [editableExpense] });
    const { getByRole, getByTestId, getByText, queryByText } =
      await renderScreen();

    jest.useFakeTimers();
    await fireEvent.press(getByTestId("delete-expense"));
    expect(getByText("Tap again to confirm")).toBeTruthy();
    expect(useExpenseStore.getState().expenses).toHaveLength(1);

    await act(async () => {
      jest.advanceTimersByTime(DELETE_CONFIRM.timeoutMs);
    });
    expect(getByText("Delete")).toBeTruthy();

    await fireEvent.press(getByTestId("delete-expense"));
    await fireEvent.press(getByTestId("delete-expense"));
    expect(useExpenseStore.getState().expenses).toHaveLength(0);
    expect(getByText("Expense deleted")).toBeTruthy();
    expect(haptics.warning).toHaveBeenCalledTimes(1);
    expect(mockBack).toHaveBeenCalledTimes(1);

    await fireEvent.press(getByRole("button", { name: "Undo" }));
    expect(useExpenseStore.getState().expenses).toEqual([editableExpense]);
    expect(queryByText("Expense deleted")).toBeNull();
    jest.useRealTimers();
  });
});
