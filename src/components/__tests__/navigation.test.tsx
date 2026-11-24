import {
    FloatingTabBar,
    type FloatingTabRoute,
} from "@/components/FloatingTabBar";
import { SheetOpenProgressProvider } from "@/components/SheetOpenProgressProvider";
import * as haptics from "@/lib/haptics";
import { useExpenseStore } from "@/store/useExpenseStore";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import type { ReactElement } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
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

const routes: readonly FloatingTabRoute[] = [
  { key: "home", title: "Home", icon: "home-outline" },
  { key: "expenses", title: "Expenses", icon: "receipt-outline" },
  { key: "stats", title: "Stats", icon: "bar-chart-outline" },
];

const safeAreaMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function renderWithProviders(screen: ReactElement) {
  return render(
    <SafeAreaProvider initialMetrics={safeAreaMetrics}>
      <ThemeProvider>
        <SheetOpenProgressProvider>{screen}</SheetOpenProgressProvider>
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  useExpenseStore.setState({ themeMode: "light" });
  mockPush.mockClear();
  jest.spyOn(haptics, "selection").mockResolvedValue(undefined);
  jest.spyOn(haptics, "lightImpact").mockResolvedValue(undefined);
});

describe("floating navigation", () => {
  it("exposes selected tab state and fires selection haptics only on change", async () => {
    const onTabPress = jest.fn();
    const { getByRole } = await renderWithProviders(
      <FloatingTabBar
        routes={routes}
        activeIndex={0}
        bottomInset={safeAreaMetrics.insets.bottom}
        onTabPress={onTabPress}
      />,
    );

    const home = getByRole("tab", { name: "Home" });
    const expenses = getByRole("tab", { name: "Expenses" });
    expect(home.props.accessibilityState).toEqual({ selected: true });
    expect(expenses.props.accessibilityState).toEqual({ selected: false });

    await fireEvent.press(expenses);
    expect(haptics.selection).toHaveBeenCalledTimes(1);
    expect(onTabPress).toHaveBeenCalledWith("expenses");

    await fireEvent.press(home);
    expect(haptics.selection).toHaveBeenCalledTimes(1);
    expect(onTabPress).toHaveBeenCalledWith("home");
  });

  it("fires a light impact and navigates to the Add stub from the FAB", async () => {
    const { getByRole } = await renderWithProviders(
      <FloatingTabBar
        routes={routes}
        activeIndex={0}
        bottomInset={safeAreaMetrics.insets.bottom}
        onTabPress={jest.fn()}
      />,
    );

    await fireEvent.press(getByRole("button", { name: "Add expense" }));
    expect(haptics.lightImpact).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/add");
  });
});
