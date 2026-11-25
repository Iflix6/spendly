import { BudgetSheet } from "@/components/BudgetSheet";
import { SheetOpenProgressProvider } from "@/components/SheetOpenProgressProvider";
import * as haptics from "@/lib/haptics";
import { useExpenseStore } from "@/store/useExpenseStore";
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
import { SafeAreaProvider } from "react-native-safe-area-context";

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

const safeAreaMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

async function renderSheet(onDismiss: () => void) {
  return render(
    <SafeAreaProvider initialMetrics={safeAreaMetrics}>
      <ThemeProvider>
        <SheetOpenProgressProvider>
          <BudgetSheet onDismiss={onDismiss} />
        </SheetOpenProgressProvider>
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  useExpenseStore.setState({ budgetCents: 150000, themeMode: "light" });
  jest.spyOn(haptics, "selection").mockResolvedValue(undefined);
  jest.spyOn(haptics, "success").mockResolvedValue(undefined);
  jest.spyOn(haptics, "warning").mockResolvedValue(undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("BudgetSheet", () => {
  it("saves a budget through the shared keypad and dismisses", async () => {
    const onDismiss = jest.fn();
    const { getByLabelText, getByRole, getByTestId } =
      await renderSheet(onDismiss);

    expect(getByLabelText("Budget amount $1,500")).toBeTruthy();

    await fireEvent(getByTestId("keypad-backspace"), "longPress");
    await fireEvent.press(getByTestId("keypad-2"));
    await fireEvent.press(getByTestId("keypad-5"));
    expect(getByLabelText("Budget amount $25")).toBeTruthy();

    await fireEvent.press(getByRole("button", { name: "Save budget" }));

    expect(useExpenseStore.getState().budgetCents).toBe(2500);
    expect(haptics.success).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("rejects a budget below one dollar and accepts the minimum", async () => {
    const onDismiss = jest.fn();
    const { getByLabelText, getByRole, getByTestId } =
      await renderSheet(onDismiss);

    await fireEvent(getByTestId("keypad-backspace"), "longPress");
    for (const key of ["0", ".", "5", "0"]) {
      await fireEvent.press(getByTestId(`keypad-${key}`));
    }
    expect(getByLabelText("Budget amount $0.50")).toBeTruthy();

    await fireEvent.press(getByRole("button", { name: "Save budget" }));

    expect(useExpenseStore.getState().budgetCents).toBe(150000);
    expect(haptics.warning).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();

    await fireEvent(getByTestId("keypad-backspace"), "longPress");
    await fireEvent.press(getByTestId("keypad-1"));
    await fireEvent.press(getByRole("button", { name: "Save budget" }));

    expect(useExpenseStore.getState().budgetCents).toBe(100);
    expect(haptics.success).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
