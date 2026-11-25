import {
    AnimatedNumber,
    formatAnimatedNumber,
} from "@/components/AnimatedNumber";
import { describe, expect, it } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";

describe("AnimatedNumber", () => {
  it("exposes the full formatted value with prefix and suffix", async () => {
    const { getByLabelText, getByText } = await render(
      <AnimatedNumber value={1234.5} prefix="$" suffix=" spent" />,
    );

    expect(getByLabelText("$1,234.50 spent")).toBeTruthy();
    expect(getByText("$")).toBeTruthy();
    expect(getByText(",")).toBeTruthy();
    expect(getByText(".")).toBeTruthy();
    expect(getByText(" spent")).toBeTruthy();
  });

  it("updates its accessibility label when the value changes", async () => {
    const { getByLabelText, queryByLabelText, rerender } = await render(
      <AnimatedNumber value={10} />,
    );

    expect(getByLabelText("10.00")).toBeTruthy();

    await rerender(<AnimatedNumber value={25.5} />);

    expect(queryByLabelText("10.00")).toBeNull();
    expect(getByLabelText("25.50")).toBeTruthy();
  });

  it("applies a configurable text style to static characters", async () => {
    const { getByText } = await render(
      <AnimatedNumber value={12} prefix="$" style={{ fontSize: 28 }} />,
    );

    expect(getByText("$")).toHaveStyle({ fontSize: 28 });
  });

  it("scales nine-digit amounts to the available width", async () => {
    const { getByLabelText, getByText } = await render(
      <AnimatedNumber value={999999999} prefix="$" style={{ fontSize: 40 }} />,
    );

    await fireEvent(getByLabelText("$999,999,999.00"), "layout", {
      nativeEvent: {
        layout: { x: 0, y: 0, width: 180, height: 48 },
      },
    });

    expect(getByText("$")).toHaveStyle({ fontSize: 20 });
  });

  it("formats negative and non-finite values safely", () => {
    expect(formatAnimatedNumber(-12.3, 1)).toBe("-12.3");
    expect(formatAnimatedNumber(1.239, 2)).toBe("1.24");
    expect(formatAnimatedNumber(Number.NaN)).toBe("0.00");
    expect(formatAnimatedNumber(Number.POSITIVE_INFINITY)).toBe("0.00");
  });
});
