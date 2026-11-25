import { SheetOpenProgressProvider } from "@/components/SheetOpenProgressProvider";
import { SnackbarProvider } from "@/components/SnackbarProvider";
import { TAB_BAR } from "@/constants/navigation";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { toNoonISO } from "@/lib/dates";
import * as haptics from "@/lib/haptics";
import { useExpenseStore, type Expense } from "@/store/useExpenseStore";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { darkColors, lightColors, spacing } from "@/theme/tokens";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import HomeScreen from "../(tabs)/index";
import AddExpenseScreen from "../add";
import ExpenseDetailScreen from "../expense/[id]";

let mockParams: { id?: string } = {};
const mockBack = jest.fn();
const mockCanGoBack = jest.fn(() => true);
const mockNavigate = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockRouter = {
  back: mockBack,
  canGoBack: mockCanGoBack,
  navigate: mockNavigate,
  push: mockPush,
  replace: mockReplace,
};

jest.mock("@/lib/expenseTransition", () => {
  const actual =
    jest.requireActual<typeof import("@/lib/expenseTransition")>(
      "@/lib/expenseTransition",
    );
  return {
    ...actual,
    measureExpenseRowTransition: jest.fn(() => Promise.resolve(null)),
  };
});

jest.mock("expo-router", () => ({
  useIsFocused: () => true,
  useLocalSearchParams: () => mockParams,
  useRouter: () => mockRouter,
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

function HeightProbe() {
  const height = useTabBarHeight();
  return <Text testID="tab-bar-height">{height}</Text>;
}

function renderScreen(screen: React.ReactElement) {
  return render(
    <SafeAreaProvider initialMetrics={safeAreaMetrics}>
      <ThemeProvider>
        <SheetOpenProgressProvider>
          <SnackbarProvider>{screen}</SnackbarProvider>
        </SheetOpenProgressProvider>
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

const monthlyExpense: Expense = {
  id: "home-food",
  amountCents: 1250,
  categoryId: "food",
  date: toNoonISO(new Date()),
  note: "Lunch at Mama Put",
  createdAt: 100,
};

function recentExpenseLabel(index: number): string {
  return `Recent expense ${index}, Food, 12 dollars 50 cents, today`;
}

beforeEach(() => {
  mockParams = {};
  useExpenseStore.setState({
    expenses: [monthlyExpense],
    budgetCents: 100000,
    themeMode: "light",
    lastDeleted: null,
  });
  mockBack.mockClear();
  mockCanGoBack.mockReset().mockReturnValue(true);
  mockNavigate.mockClear();
  mockPush.mockClear();
  mockReplace.mockClear();
  jest.spyOn(haptics, "selection").mockResolvedValue(undefined);
  jest.spyOn(haptics, "warning").mockResolvedValue(undefined);
});

describe("tab screen shell", () => {
  it("renders the Spendly wordmark with light theme colors", async () => {
    const { getByText } = await renderScreen(<HomeScreen />);
    expect(getByText("Spendly")).toHaveStyle({ color: lightColors.text });
  });

  it("renders the Spendly wordmark with dark theme colors", async () => {
    useExpenseStore.setState({ themeMode: "dark" });
    const { getByText } = await renderScreen(<HomeScreen />);
    expect(getByText("Spendly")).toHaveStyle({ color: darkColors.text });
  });

  it("opens Expenses with the selected category from Home", async () => {
    const { getByTestId } = await renderScreen(<HomeScreen />);

    await fireEvent.press(getByTestId("category-card-food"));

    expect(mockNavigate).toHaveBeenCalledWith("/(tabs)/expenses?category=food");
    expect(haptics.selection).toHaveBeenCalledTimes(1);
  });

  it("clears the category filter through See all", async () => {
    const { getByRole } = await renderScreen(<HomeScreen />);

    await fireEvent.press(getByRole("button", { name: "See all expenses" }));

    expect(mockNavigate).toHaveBeenCalledWith("/(tabs)/expenses?category=all");
  });

  it("limits Recent to five monthly expenses and opens a detail", async () => {
    const monthlyExpenses = Array.from({ length: 6 }, (_, index) => ({
      ...monthlyExpense,
      id: `recent-${index}`,
      note: `Recent expense ${index}`,
      createdAt: index + 1,
    }));
    useExpenseStore.setState({ expenses: monthlyExpenses });
    const { getByLabelText, queryByLabelText } = await renderScreen(
      <HomeScreen />,
    );

    for (let index = 1; index <= 5; index += 1) {
      expect(getByLabelText(recentExpenseLabel(index))).toBeTruthy();
    }
    expect(queryByLabelText(recentExpenseLabel(0))).toBeNull();

    await fireEvent.press(getByLabelText(recentExpenseLabel(4)));
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith("/expense/recent-4"),
    );
  });

  it("shows the over-budget ring copy without capping the percentage", async () => {
    useExpenseStore.setState({ budgetCents: 1000 });
    const { getByText } = await renderScreen(<HomeScreen />);

    expect(getByText("125%")).toBeTruthy();
    expect(getByText("over by $2.50")).toBeTruthy();
  });

  it("opens the budget editor from the hero ring", async () => {
    const { getByLabelText, getByText } = await renderScreen(<HomeScreen />);

    await fireEvent.press(
      getByLabelText("Edit monthly budget, currently $1,000.00"),
    );

    expect(getByText("Monthly budget")).toBeTruthy();
  });

  it("reuses the budget editor from Settings", async () => {
    const { getByLabelText, getByRole, getByText, queryByText } =
      await renderScreen(<HomeScreen />);

    await fireEvent.press(getByRole("button", { name: "Open settings" }));
    await fireEvent.press(getByLabelText("Monthly budget $1,000.00, edit"));

    expect(queryByText("Settings")).toBeNull();
    expect(getByText("Monthly budget")).toBeTruthy();
  });

  it("opens settings and links an empty month to Add", async () => {
    useExpenseStore.setState({ expenses: [] });
    const { getByRole, getByText, queryByText } = await renderScreen(
      <HomeScreen />,
    );

    expect(getByText("No expenses this month")).toBeTruthy();
    expect(queryByText("This month by category")).toBeNull();

    await fireEvent.press(getByRole("button", { name: "Open settings" }));
    expect(getByText("Settings")).toBeTruthy();

    await fireEvent.press(getByRole("button", { name: "Close settings" }));
    await fireEvent.press(getByRole("button", { name: "Add an expense" }));
    expect(mockPush).toHaveBeenCalledWith("/add");
  });

  it("includes the bar, bottom margin, safe area, and content clearance", async () => {
    const { getByTestId } = await renderScreen(<HeightProbe />);
    const expected =
      TAB_BAR.height +
      TAB_BAR.bottomMargin +
      safeAreaMetrics.insets.bottom +
      spacing.xl;
    expect(getByTestId("tab-bar-height").props.children).toBe(expected);
  });
});

describe("stack screens", () => {
  it("closes the Add sheet and returns to the tab shell", async () => {
    const { getByRole, getByText } = await renderScreen(<AddExpenseScreen />);
    expect(getByText("New expense")).toHaveStyle({ color: lightColors.text });

    await fireEvent.press(getByRole("button", { name: "Close expense sheet" }));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("renders expense details and returns to the previous screen", async () => {
    mockParams = { id: monthlyExpense.id };
    const { getByRole, getByText } = await renderScreen(
      <ExpenseDetailScreen />,
    );
    expect(getByText("Expense details")).toHaveStyle({
      color: lightColors.text,
    });
    expect(getByText("Lunch at Mama Put")).toBeTruthy();

    await fireEvent.press(getByRole("button", { name: "Back to expenses" }));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("opens the matching expense in the editor", async () => {
    mockParams = { id: monthlyExpense.id };
    const { getByRole } = await renderScreen(<ExpenseDetailScreen />);

    await fireEvent.press(getByRole("button", { name: "Edit expense" }));
    expect(mockPush).toHaveBeenCalledWith("/add?id=home-food");
  });

  it("deletes an expense and restores it with Undo", async () => {
    mockParams = { id: monthlyExpense.id };
    const { getByRole, getByText } = await renderScreen(
      <ExpenseDetailScreen />,
    );

    await fireEvent.press(getByRole("button", { name: "Delete expense" }));
    expect(useExpenseStore.getState().expenses).toHaveLength(0);
    expect(getByText("Expense deleted")).toBeTruthy();

    await fireEvent.press(getByRole("button", { name: "Undo" }));
    expect(useExpenseStore.getState().expenses).toEqual([monthlyExpense]);
  });

  it("returns safely when the expense no longer exists", async () => {
    mockParams = { id: "missing-expense" };
    await renderScreen(<ExpenseDetailScreen />);

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("replaces the route when there is no back entry", async () => {
    mockParams = { id: monthlyExpense.id };
    mockCanGoBack.mockReturnValue(false);
    const { getByRole } = await renderScreen(<ExpenseDetailScreen />);

    await fireEvent.press(getByRole("button", { name: "Back to expenses" }));
    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/(tabs)/expenses");
  });
});
