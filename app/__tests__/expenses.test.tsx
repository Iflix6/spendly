import { SnackbarProvider } from "@/components/SnackbarProvider";
import * as haptics from "@/lib/haptics";
import { useExpenseStore, type Expense } from "@/store/useExpenseStore";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { darkColors } from "@/theme/tokens";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import type { ComponentType, ReactElement } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ExpensesScreen from "../(tabs)/expenses";

const mockPush = jest.fn();
const mockSetParams = jest.fn();
let mockCategoryParam: string | string[] | undefined;

jest.setTimeout(15000);

jest.mock("@/hooks/useDebouncedValue", () => ({
  useDebouncedValue: (value: unknown) => value,
}));

jest.mock("react-native/Libraries/Lists/SectionList", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: ({
      sections,
      renderItem,
      renderSectionHeader,
      ListEmptyComponent,
      contentContainerStyle,
    }: {
      sections: Array<{
        key: string;
        data: Array<{ id: string }>;
      }>;
      renderItem: (info: unknown) => unknown;
      renderSectionHeader: (info: unknown) => unknown;
      ListEmptyComponent?: ComponentType | ReactElement;
      contentContainerStyle?: unknown;
    }) =>
      React.createElement(
        View,
        { style: contentContainerStyle },
        sections.length === 0 && ListEmptyComponent
          ? React.isValidElement(ListEmptyComponent)
            ? ListEmptyComponent
            : React.createElement(ListEmptyComponent)
          : sections.map((section) =>
              React.createElement(
                View,
                { key: section.key },
                renderSectionHeader({ section }),
                section.data.map((item, index) =>
                  React.createElement(
                    View,
                    { key: item.id },
                    renderItem({ item, index, section }),
                  ),
                ),
              ),
            ),
      ),
  };
});

jest.mock("@/components/CategoryChip", () => {
  const React = require("react");
  const { Pressable } = require("react-native");
  return {
    CategoryChip: ({
      label,
      selected,
      onPress,
    }: {
      label: string;
      selected: boolean;
      onPress: () => void;
    }) =>
      React.createElement(Pressable, {
        accessibilityRole: "button",
        accessibilityLabel: label,
        accessibilityState: { selected },
        onPress,
      }),
  };
});

jest.mock("@/components/EmptyState", () => {
  const React = require("react");
  const { Pressable, Text, View } = require("react-native");
  return {
    EmptyState: ({
      hasFilters,
      onClearFilters,
    }: {
      hasFilters: boolean;
      onClearFilters: () => void;
    }) =>
      React.createElement(
        View,
        null,
        React.createElement(
          Text,
          null,
          hasFilters ? "No matching expenses" : "No expenses yet",
        ),
        hasFilters
          ? React.createElement(Pressable, {
              accessibilityRole: "button",
              accessibilityLabel: "Clear filters",
              onPress: onClearFilters,
            })
          : null,
      ),
  };
});

jest.mock("@/components/SwipeableRow", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return {
    SwipeableRow: ({
      expense,
      onPress,
      onDelete,
    }: {
      expense: { id: string; note: string };
      onPress: (expense: { id: string; note: string }) => void;
      onDelete: (id: string) => void;
    }) =>
      React.createElement(
        React.Fragment,
        null,
        React.createElement(
          Pressable,
          {
            testID: `row-${expense.id}`,
            accessibilityRole: "button",
            onPress: () => onPress(expense),
          },
          React.createElement(Text, null, expense.note),
        ),
        React.createElement(
          Pressable,
          {
            accessibilityRole: "button",
            accessibilityLabel: `Delete ${expense.id}`,
            onPress: () => onDelete(expense.id),
          },
          React.createElement(Text, null, `Delete ${expense.id}`),
        ),
      ),
  };
});

jest.mock("expo-router", () => ({
  useIsFocused: () => true,
  useLocalSearchParams: () => ({ category: mockCategoryParam }),
  useRouter: () => ({ push: mockPush, setParams: mockSetParams }),
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

const expenses: Expense[] = [
  {
    id: "food-today",
    amountCents: 1250,
    categoryId: "food",
    date: "2026-10-12T12:00:00.000Z",
    note: "Lunch at Mama Put",
    createdAt: 300,
  },
  {
    id: "transport-today",
    amountCents: 600,
    categoryId: "transport",
    date: "2026-10-12T12:00:00.000Z",
    note: "Bolt ride",
    createdAt: 200,
  },
  {
    id: "shopping-yesterday",
    amountCents: 4200,
    categoryId: "shopping",
    date: "2026-10-11T12:00:00.000Z",
    note: "New sneakers",
    createdAt: 100,
  },
];

function renderScreen(screen: ReactElement = <ExpensesScreen />) {
  return render(
    <SafeAreaProvider initialMetrics={safeAreaMetrics}>
      <ThemeProvider>
        <SnackbarProvider>{screen}</SnackbarProvider>
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  mockCategoryParam = undefined;
  useExpenseStore.setState({
    expenses,
    themeMode: "light",
    lastDeleted: null,
  });
  mockPush.mockClear();
  mockSetParams.mockClear();
  jest.spyOn(haptics, "selection").mockResolvedValue(undefined);
});

describe("Expenses screen", () => {
  it("renders grouped totals and opens an expense detail route", async () => {
    const { getByTestId, getByText } = await renderScreen();

    expect(getByText("$18.50")).toBeTruthy();
    expect(getByText("$60.50")).toBeTruthy();

    fireEvent.press(getByTestId("row-food-today"));
    expect(mockPush).toHaveBeenCalledWith("/expense/food-today");
  });

  it("preselects a valid category from the route", async () => {
    mockCategoryParam = "transport";
    const { getByRole, getByText, queryByText } = await renderScreen();

    expect(
      getByRole("button", { name: "Transport" }).props.accessibilityState,
    ).toEqual({ selected: true });
    expect(getByText("Bolt ride")).toBeTruthy();
    expect(queryByText("Lunch at Mama Put")).toBeNull();
    expect(queryByText("New sneakers")).toBeNull();
  });

  it("falls back to All for an invalid route category", async () => {
    mockCategoryParam = "invalid";
    const { getByRole, getByText } = await renderScreen();

    expect(
      getByRole("button", { name: "All" }).props.accessibilityState,
    ).toEqual({ selected: true });
    expect(getByText("Lunch at Mama Put")).toBeTruthy();
    expect(getByText("Bolt ride")).toBeTruthy();
    expect(getByText("New sneakers")).toBeTruthy();
  });

  it("combines debounced search with the selected category", async () => {
    const { getByLabelText, getByRole, getByText, queryByText } =
      await renderScreen();

    fireEvent.changeText(getByLabelText("Search expenses"), "ride");
    await waitFor(() => expect(queryByText("Lunch at Mama Put")).toBeNull());
    expect(getByText("Bolt ride")).toBeTruthy();

    fireEvent.press(getByRole("button", { name: "Food" }));
    await waitFor(() => expect(getByText("No matching expenses")).toBeTruthy());
    expect(mockSetParams).toHaveBeenCalledWith({ category: "food" });
    expect(haptics.selection).toHaveBeenCalledTimes(1);

    fireEvent.press(getByRole("button", { name: "Clear filters" }));
    await waitFor(() => expect(getByText("Lunch at Mama Put")).toBeTruthy());
    expect(getByText("Bolt ride")).toBeTruthy();
    expect(mockSetParams).toHaveBeenLastCalledWith({ category: "all" });
  });

  it("returns to All when the selected category is tapped again", async () => {
    const { getByRole, getByText, queryByText } = await renderScreen();

    fireEvent.press(getByRole("button", { name: "Food" }));
    await waitFor(() => expect(getByText("Lunch at Mama Put")).toBeTruthy());
    expect(queryByText("Bolt ride")).toBeNull();

    fireEvent.press(getByRole("button", { name: "Food" }));
    await waitFor(() => expect(getByText("Bolt ride")).toBeTruthy());
    expect(haptics.selection).toHaveBeenCalledTimes(2);
  });

  it("deletes an expense and restores it with Undo", async () => {
    const { getByLabelText, getByRole, getByText, queryByText } =
      await renderScreen();

    fireEvent.press(getByLabelText("Delete food-today"));
    await waitFor(() => expect(queryByText("Lunch at Mama Put")).toBeNull());
    expect(getByText("Expense deleted")).toBeTruthy();

    fireEvent.press(getByRole("button", { name: "Undo" }));
    await waitFor(() => expect(getByText("Lunch at Mama Put")).toBeTruthy());
    expect(queryByText("Expense deleted")).toBeNull();
  });

  it("uses the dark theme title color", async () => {
    useExpenseStore.setState({ themeMode: "dark" });
    const { getByText } = await renderScreen();

    expect(getByText("Expenses")).toHaveStyle({ color: darkColors.text });
  });
});
