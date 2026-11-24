import { TAB_BAR } from "@/constants/navigation";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { useExpenseStore } from "@/store/useExpenseStore";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { darkColors, lightColors, spacing } from "@/theme/tokens";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import { Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AddExpenseStub from "../add";
import ExpenseDetailStub from "../expense/[id]";
import HomeScreen from "../(tabs)/index";

const mockBack = jest.fn();

jest.mock("expo-router", () => ({
  useIsFocused: () => true,
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
      <ThemeProvider>{screen}</ThemeProvider>
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  useExpenseStore.setState({ themeMode: "light" });
  mockBack.mockClear();
});

describe("tab screen shell", () => {
  it("renders the Home title with light theme colors", async () => {
    const { getByText } = await renderScreen(<HomeScreen />);
    expect(getByText("Home")).toHaveStyle({ color: lightColors.text });
  });

  it("renders the Home title with dark theme colors", async () => {
    useExpenseStore.setState({ themeMode: "dark" });
    const { getByText } = await renderScreen(<HomeScreen />);
    expect(getByText("Home")).toHaveStyle({ color: darkColors.text });
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

describe("stack stubs", () => {
  it("closes the Add stub and returns to the tab shell", async () => {
    const { getByRole, getByText } = await renderScreen(<AddExpenseStub />);
    expect(getByText("Add expense")).toHaveStyle({ color: lightColors.text });

    await fireEvent.press(getByRole("button", { name: "Close add expense" }));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("returns from the expense detail stub", async () => {
    const { getByRole, getByText } = await renderScreen(
      <ExpenseDetailStub />,
    );
    expect(getByText("Expense details")).toHaveStyle({
      color: lightColors.text,
    });

    await fireEvent.press(getByRole("button", { name: "Back to expenses" }));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
