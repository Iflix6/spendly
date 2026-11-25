import { SettingsSheet } from "@/components/SettingsSheet";
import { SheetOpenProgressProvider } from "@/components/SheetOpenProgressProvider";
import { DEFAULT_BUDGET_CENTS } from "@/constants";
import { SETTINGS_SHEET } from "@/constants/home";
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
import { act, fireEvent, render } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { version: "1.2.3" } },
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

const safeAreaMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

async function renderSettings(onDismiss: () => void, onEditBudget: () => void) {
  return render(
    <SafeAreaProvider initialMetrics={safeAreaMetrics}>
      <ThemeProvider>
        <SheetOpenProgressProvider>
          <SettingsSheet onDismiss={onDismiss} onEditBudget={onEditBudget} />
        </SheetOpenProgressProvider>
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  useExpenseStore.setState({
    expenses: [],
    budgetCents: 150000,
    themeMode: "light",
    hasSeeded: false,
    lastDeleted: null,
  });
  jest.spyOn(haptics, "selection").mockResolvedValue(undefined);
  jest.spyOn(haptics, "warning").mockResolvedValue(undefined);
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe("SettingsSheet", () => {
  it("writes theme selections and shows the app version", async () => {
    const { getByRole, getByText } = await renderSettings(jest.fn(), jest.fn());

    expect(getByText("Spendly 1.2.3")).toBeTruthy();
    expect(
      getByRole("tab", { name: "Light theme" }).props.accessibilityState,
    ).toEqual({ selected: true });

    await fireEvent.press(getByRole("tab", { name: "Dark theme" }));
    expect(useExpenseStore.getState().themeMode).toBe("dark");
    expect(
      getByRole("tab", { name: "Dark theme" }).props.accessibilityState,
    ).toEqual({ selected: true });

    await fireEvent.press(getByRole("tab", { name: "System theme" }));
    expect(useExpenseStore.getState().themeMode).toBe("system");
  });

  it("opens the shared budget flow from the monthly budget row", async () => {
    const onEditBudget = jest.fn();
    const { getByRole } = await renderSettings(jest.fn(), onEditBudget);

    await fireEvent.press(
      getByRole("button", { name: "Monthly budget $1,500.00, edit" }),
    );

    expect(onEditBudget).toHaveBeenCalledTimes(1);
    expect(haptics.selection).toHaveBeenCalledTimes(1);
  });

  it("requires a second reset tap before restoring demo data", async () => {
    const onDismiss = jest.fn();
    const { getByRole, getByText } = await renderSettings(onDismiss, jest.fn());

    await fireEvent.press(getByRole("button", { name: "Reset demo data" }));

    expect(getByText("Tap again to confirm")).toBeTruthy();
    expect(useExpenseStore.getState().expenses).toHaveLength(0);
    expect(onDismiss).not.toHaveBeenCalled();

    await fireEvent.press(
      getByRole("button", { name: "Tap again to confirm" }),
    );

    expect(useExpenseStore.getState().expenses.length).toBeGreaterThan(0);
    expect(useExpenseStore.getState().budgetCents).toBe(DEFAULT_BUDGET_CENTS);
    expect(useExpenseStore.getState().hasSeeded).toBe(true);
    expect(haptics.warning).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("disarms reset confirmation after the timeout", async () => {
    const { getByRole, getByText, queryByText } = await renderSettings(
      jest.fn(),
      jest.fn(),
    );
    jest.useFakeTimers();

    await fireEvent.press(getByRole("button", { name: "Reset demo data" }));
    expect(getByText("Tap again to confirm")).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(SETTINGS_SHEET.resetConfirmTimeoutMs);
    });

    expect(queryByText("Tap again to confirm")).toBeNull();
    expect(getByText("Reset demo data")).toBeTruthy();
    expect(useExpenseStore.getState().expenses).toHaveLength(0);
  });
});
