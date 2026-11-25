import {
    datePreset,
    formatKeypadDisplay,
    keypadValueFromCents,
} from "@/lib/expenseForm";
import { describe, expect, it } from "@jest/globals";

describe("expense form helpers", () => {
  it("converts edit amounts to keypad values without trailing zeroes", () => {
    expect(keypadValueFromCents(0)).toBe("");
    expect(keypadValueFromCents(100)).toBe("1");
    expect(keypadValueFromCents(1010)).toBe("10.1");
    expect(keypadValueFromCents(1001)).toBe("10.01");
  });

  it("groups display digits while preserving an in-progress decimal", () => {
    expect(formatKeypadDisplay("")).toBe("0");
    expect(formatKeypadDisplay("1234567.8")).toBe("1,234,567.8");
    expect(formatKeypadDisplay("12.")).toBe("12.");
  });

  it("classifies today, yesterday, and custom dates deterministically", () => {
    const now = new Date(2026, 9, 12, 18, 0, 0);
    const yesterday = new Date(2026, 9, 11, 12, 0, 0);
    const custom = new Date(2026, 9, 10, 12, 0, 0);

    expect(datePreset(now, now)).toBe("today");
    expect(datePreset(yesterday, now)).toBe("yesterday");
    expect(datePreset(custom, now)).toBe("custom");
  });
});
