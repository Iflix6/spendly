import { TAB_BAR } from "@/constants/navigation";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { useExpenseStore } from "@/store/useExpenseStore";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { darkColors, lightColors, spacing } from "@/theme/tokens";
import { beforeEach, describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";
import { Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import HomeScreen from "../(tabs)/index";

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
