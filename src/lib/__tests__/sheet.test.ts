import { BOTTOM_SHEET } from "@/constants/expenseForm";
import { shouldDismissSheet } from "@/lib/sheet";
import { describe, expect, it } from "@jest/globals";

describe("bottom sheet dismissal", () => {
  it("requires the drag to pass the distance threshold", () => {
    expect(shouldDismissSheet(BOTTOM_SHEET.dismissDistance, 0)).toBe(false);
    expect(shouldDismissSheet(BOTTOM_SHEET.dismissDistance + 1, 0)).toBe(true);
  });

  it("allows a fast downward flick to dismiss", () => {
    expect(shouldDismissSheet(0, BOTTOM_SHEET.dismissVelocity)).toBe(false);
    expect(shouldDismissSheet(0, BOTTOM_SHEET.dismissVelocity + 1)).toBe(true);
  });

  it("springs back for slow, short drags", () => {
    expect(shouldDismissSheet(80, 300)).toBe(false);
  });
});
