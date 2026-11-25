import { getBudgetRingState } from "@/lib/budget";
import { describe, expect, it } from "@jest/globals";

describe("budget ring state", () => {
  it("uses success below the warning threshold", () => {
    const state = getBudgetRingState(5000, 10000);

    expect(state.visualRatio).toBe(0.5);
    expect(state.percentLabel).toBe("50%");
    expect(state.remainingCents).toBe(5000);
    expect(state.isOverBudget).toBe(false);
    expect(state.status).toBe("success");
    expect(state.colorPosition).toBe(0);
  });

  it("uses warning through the amber range", () => {
    const state = getBudgetRingState(8000, 10000);

    expect(state.status).toBe("warning");
    expect(state.colorPosition).toBe(0.5);
    expect(state.percentLabel).toBe("80%");
  });

  it("switches to danger at ninety percent", () => {
    const state = getBudgetRingState(9000, 10000);

    expect(state.status).toBe("danger");
    expect(state.colorPosition).toBe(1);
    expect(state.isOverBudget).toBe(false);
  });

  it("caps the visual sweep and reports the overage", () => {
    const state = getBudgetRingState(12000, 10000);

    expect(state.ratio).toBe(1.2);
    expect(state.visualRatio).toBe(1);
    expect(state.percentLabel).toBe("120%");
    expect(state.remainingCents).toBe(-2000);
    expect(state.isOverBudget).toBe(true);
    expect(state.status).toBe("danger");
  });

  it("guards a zero budget without dividing by zero", () => {
    const empty = getBudgetRingState(0, 0);
    const spent = getBudgetRingState(100, 0);

    expect(empty.ratio).toBe(0);
    expect(empty.visualRatio).toBe(0);
    expect(empty.percentLabel).toBe("—");
    expect(empty.isOverBudget).toBe(false);
    expect(spent.visualRatio).toBe(1);
    expect(spent.percentLabel).toBe("—");
    expect(spent.isOverBudget).toBe(true);
    expect(Number.isFinite(spent.ratio)).toBe(true);
  });

  it("normalizes invalid cent values", () => {
    const state = getBudgetRingState(Number.NaN, Number.POSITIVE_INFINITY);

    expect(state.spentCents).toBe(0);
    expect(state.budgetCents).toBe(0);
    expect(state.visualRatio).toBe(0);
    expect(state.percentLabel).toBe("—");
  });
});
