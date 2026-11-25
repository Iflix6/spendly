import { toNoonISO } from "@/lib/dates";
import * as haptics from "@/lib/haptics";
import { monthlyDateLabel } from "@/lib/stats";
import { useExpenseStore, type Expense } from "@/store/useExpenseStore";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { darkColors, lightColors } from "@/theme/tokens";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import { addMonths, startOfMonth, subMonths } from "date-fns";
import { SafeAreaProvider } from "react-native-safe-area-context";
import StatsScreen from "../(tabs)/stats";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useIsFocused: () => true,
  useRouter: () => ({ push: mockPush }),
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

const currentMonth = startOfMonth(new Date());
const previousMonth = subMonths(currentMonth, 1);
const olderMonth = subMonths(currentMonth, 2);

function expense(
  id: string,
  month: Date,
  amountCents: number,
  categoryId: Expense["categoryId"] = "food",
): Expense {
  const date = new Date(month.getFullYear(), month.getMonth(), 5, 12);
  return {
    id,
    date: toNoonISO(date),
    amountCents,
    categoryId,
    note: id,
    createdAt: 0,
  };
}

function renderScreen() {
  return render(
    <SafeAreaProvider initialMetrics={safeAreaMetrics}>
      <ThemeProvider>
        <StatsScreen />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  useExpenseStore.setState({
    expenses: [
      expense("current-food", currentMonth, 15000, "food"),
      expense("previous-food", previousMonth, 10000, "food"),
    ],
    themeMode: "light",
  });
  mockPush.mockClear();
  jest.spyOn(haptics, "selection").mockResolvedValue(undefined);
});

describe("Stats screen", () => {
  it("renders the current month and disables next at the current month", async () => {
    const { getByText, getByLabelText } = await renderScreen();

    expect(getByText(monthlyDateLabel(currentMonth))).toBeTruthy();
    expect(getByLabelText("Next month")).toBeDisabled();
    expect(getByLabelText("Previous month")).not.toBeDisabled();
    expect(getByLabelText("Total spent $150.00")).toBeTruthy();
  });

  it("uses dark theme text colors", async () => {
    useExpenseStore.setState({ themeMode: "dark" });
    const { getByText } = await renderScreen();

    expect(getByText("Stats")).toHaveStyle({ color: darkColors.text });
  });

  it("navigates between data months and stops at the earliest month", async () => {
    useExpenseStore.setState({
      expenses: [
        expense("current", currentMonth, 15000),
        expense("previous", previousMonth, 10000),
        expense("older", olderMonth, 5000),
      ],
    });
    const { getByText, getByLabelText } = await renderScreen();

    await fireEvent.press(getByLabelText("Previous month"));
    expect(getByText(monthlyDateLabel(previousMonth))).toBeTruthy();
    expect(getByLabelText("Next month")).not.toBeDisabled();

    await fireEvent.press(getByLabelText("Previous month"));
    expect(getByText(monthlyDateLabel(olderMonth))).toBeTruthy();
    expect(getByLabelText("Previous month")).toBeDisabled();

    await fireEvent.press(getByLabelText("Next month"));
    expect(getByText(monthlyDateLabel(previousMonth))).toBeTruthy();
  });

  it("shows a danger delta when spending is higher", async () => {
    const { getByText } = await renderScreen();

    expect(getByText("50.0% vs last month")).toBeTruthy();
    expect(getByText("trending-up-outline")).toHaveStyle({
      color: lightColors.danger,
    });
  });

  it("shows a success delta when spending is lower", async () => {
    useExpenseStore.setState({
      expenses: [
        expense("current", currentMonth, 5000),
        expense("previous", previousMonth, 10000),
      ],
    });
    const { getByText } = await renderScreen();

    expect(getByText("50.0% vs last month")).toBeTruthy();
    expect(getByText("trending-down-outline")).toHaveStyle({
      color: lightColors.success,
    });
  });

  it("uses a neutral delta when the previous month has no spending", async () => {
    useExpenseStore.setState({
      expenses: [expense("current", currentMonth, 5000)],
    });
    const { getByText } = await renderScreen();

    expect(getByText("No prior month")).toBeTruthy();
    expect(getByText("remove-outline")).toHaveStyle({
      color: lightColors.textMuted,
    });
  });

  it("replaces charts with the empty state for an empty selected month", async () => {
    useExpenseStore.setState({
      expenses: [expense("previous", previousMonth, 10000)],
    });
    const { getByText, getByLabelText, queryByText } = await renderScreen();

    expect(getByText("No expenses this month")).toBeTruthy();
    expect(queryByText("By category")).toBeNull();

    await fireEvent.press(getByLabelText("Previous month"));
    expect(getByText("By category")).toBeTruthy();
    expect(getByText("Spending over time")).toBeTruthy();
  });

  it("links donut legend selection to the center and toggles it off", async () => {
    useExpenseStore.setState({
      expenses: [
        expense("food", currentMonth, 7500, "food"),
        expense("transport", currentMonth, 2500, "transport"),
        expense("previous", previousMonth, 10000, "food"),
      ],
    });
    const { getByTestId, getByText, getAllByText, queryByText } =
      await renderScreen();

    await fireEvent.press(getByTestId("donut-legend-food"));

    expect(getByText("75.0% of total")).toBeTruthy();
    expect(getAllByText("Food")).toHaveLength(2);
    expect(haptics.selection).toHaveBeenCalled();

    await fireEvent(getByTestId("donut-chart-root"), "touchStart");
    expect(queryByText("75.0% of total")).toBeNull();

    await fireEvent.press(getByTestId("donut-legend-food"));
    await fireEvent.press(getByTestId("donut-legend-food"));
    expect(queryByText("75.0% of total")).toBeNull();
  });

  it("switches the bar chart between Week and Day modes", async () => {
    const { getByRole } = await renderScreen();
    const dayTab = getByRole("tab", { name: "Day view" });
    const weekTab = getByRole("tab", { name: "Week view" });

    expect(weekTab.props.accessibilityState).toEqual({ selected: true });
    await fireEvent.press(dayTab);
    expect(dayTab.props.accessibilityState).toEqual({ selected: true });
    expect(weekTab.props.accessibilityState).toEqual({ selected: false });
  });

  it("opens Add from the empty month state", async () => {
    useExpenseStore.setState({ expenses: [] });
    const { getByRole } = await renderScreen();

    await fireEvent.press(getByRole("button", { name: "Add an expense" }));
    expect(mockPush).toHaveBeenCalledWith("/add");
  });

  it("can return from the previous month to the current month", async () => {
    const { getByText, getByLabelText } = await renderScreen();

    await fireEvent.press(getByLabelText("Previous month"));
    await fireEvent.press(getByLabelText("Next month"));

    expect(
      getByText(monthlyDateLabel(addMonths(previousMonth, 1))),
    ).toBeTruthy();
    expect(getByLabelText("Next month")).toBeDisabled();
  });
});
