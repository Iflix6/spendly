import { BudgetRing } from "@/components/BudgetRing";
import { useExpenseStore } from "@/store/useExpenseStore";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightColors } from "@/theme/tokens";
import { describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";

function renderRing(spentCents: number, budgetCents: number) {
  useExpenseStore.setState({ themeMode: "light" });

  return render(
    <ThemeProvider>
      <BudgetRing
        spentCents={spentCents}
        budgetCents={budgetCents}
        size={112}
      />
    </ThemeProvider>,
  );
}

describe("BudgetRing", () => {
  it("shows the percentage and remaining budget below the limit", async () => {
    const { getByText } = await renderRing(5000, 10000);

    expect(getByText("50%")).toBeTruthy();
    expect(getByText("left: $50.00")).toBeTruthy();
  });

  it("shows the uncapped percentage with accessible overage copy", async () => {
    const { getByText } = await renderRing(12000, 10000);

    expect(getByText("120%")).toBeTruthy();
    expect(getByText("over by $20.00")).toHaveStyle({
      color: lightColors.onAccent,
    });
  });

  it("guards a zero budget in the center copy", async () => {
    const { getByText, queryByText } = await renderRing(0, 0);

    expect(getByText("—")).toBeTruthy();
    expect(getByText("left: $0.00")).toBeTruthy();
    expect(queryByText("NaN")).toBeNull();
  });
});
