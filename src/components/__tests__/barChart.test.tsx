import { BarChart } from "@/components/BarChart";
import { BAR_CHART } from "@/constants/stats";
import { localDateKey } from "@/lib/dates";
import * as haptics from "@/lib/haptics";
import type { DaySpend, WeekSpend } from "@/lib/stats";
import { useExpenseStore } from "@/store/useExpenseStore";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightColors } from "@/theme/tokens";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";

const weekData: readonly WeekSpend[] = Array.from(
  { length: 5 },
  (_, bucket) => ({
    bucket,
    amountCents: (bucket + 1) * 1000,
  }),
);

function daysInMonth(year: number, monthIndex: number): DaySpend[] {
  const count = new Date(year, monthIndex + 1, 0).getDate();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(year, monthIndex, index + 1, 12);
    return {
      date: localDateKey(date),
      amountCents: index === count - 1 ? 5000 : 0,
    };
  });
}

function renderChart(dayData: readonly DaySpend[], isCurrentMonth = false) {
  return render(
    <ThemeProvider>
      <BarChart
        weekData={weekData}
        dayData={dayData}
        isCurrentMonth={isCurrentMonth}
      />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  useExpenseStore.setState({ themeMode: "light" });
  jest.spyOn(haptics, "selection").mockResolvedValue(undefined);
});

describe("BarChart", () => {
  it("renders five week buckets by default", async () => {
    const { queryAllByTestId } = await renderChart(daysInMonth(2026, 9));

    expect(queryAllByTestId(/^bar-label-week-/)).toHaveLength(5);
  });

  it("shows a tooltip and dismisses it on an outside touch", async () => {
    const { getByTestId, getByText, queryByText } = await renderChart(
      daysInMonth(2026, 9),
    );

    await fireEvent(getByTestId("bar-chart-root"), "layout", {
      nativeEvent: {
        layout: { x: 0, y: 0, width: 300, height: BAR_CHART.height },
      },
    });
    await fireEvent(
      getByTestId("bar-canvas", { includeHiddenElements: true }),
      "touchStart",
      {
        nativeEvent: { locationX: 20, locationY: 100 },
        stopPropagation: jest.fn(),
      },
    );

    expect(getByText("Week 1", { includeHiddenElements: true })).toBeTruthy();
    expect(getByText("$10.00", { includeHiddenElements: true })).toBeTruthy();
    expect(haptics.selection).toHaveBeenCalled();

    await fireEvent(getByTestId("bar-chart-root"), "touchStart", {
      nativeEvent: { locationX: 0, locationY: 0 },
    });
    expect(queryByText("Week 1", { includeHiddenElements: true })).toBeNull();
  });

  it("renders all 31 days in Day mode", async () => {
    const { getByRole, queryAllByTestId } = await renderChart(
      daysInMonth(2026, 9),
    );

    await fireEvent.press(getByRole("tab", { name: "Day view" }));
    expect(queryAllByTestId(/^bar-label-/)).toHaveLength(31);
  });

  it("renders 28 days for a non-leap February", async () => {
    const { getByRole, queryAllByTestId } = await renderChart(
      daysInMonth(2026, 1),
    );

    await fireEvent.press(getByRole("tab", { name: "Day view" }));
    expect(queryAllByTestId(/^bar-label-/)).toHaveLength(28);
  });

  it("highlights today only when the current month is shown", async () => {
    const today = localDateKey(new Date());
    const data: DaySpend[] = [
      { date: today, amountCents: 1000 },
      { date: "2026-01-01", amountCents: 0 },
    ];
    const { getByRole, getByTestId } = await renderChart(data, true);

    await fireEvent.press(getByRole("tab", { name: "Day view" }));
    expect(getByTestId(`bar-label-${today}`)).toHaveStyle({
      color: lightColors.accentText,
    });
  });
});
