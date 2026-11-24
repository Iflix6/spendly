import {
    centsFromKeypad,
    centsToDisplayParts,
    formatMoney,
    parseKeypadInput,
} from "@/lib/money";
import { describe, expect, it } from "@jest/globals";

describe("money", () => {
  it("formats cents as currency with two decimals", () => {
    expect(formatMoney(123456)).toBe("$1,234.56");
    expect(formatMoney(0)).toBe("$0.00");
    expect(formatMoney(505, { symbol: "€" })).toBe("€5.05");
  });

  it("keeps the sign before a custom currency symbol", () => {
    expect(formatMoney(-505, { symbol: "£" })).toBe("-£5.05");
  });

  it("formats compact thousands and millions", () => {
    expect(formatMoney(150000, { compact: true })).toBe("$1.5k");
    expect(formatMoney(100000, { compact: true })).toBe("$1k");
    expect(formatMoney(100000000, { compact: true })).toBe("$1M");
  });

  it("handles decimal starts and prevents leading zeros", () => {
    expect(parseKeypadInput("", ".")).toBe("0.");
    expect(parseKeypadInput("0", "5")).toBe("5");
    expect(parseKeypadInput("0.", "5")).toBe("0.5");
    expect(parseKeypadInput("12", ".")).toBe("12.");
  });

  it("limits decimals and total digits", () => {
    expect(parseKeypadInput("12.34", "5")).toBe("12.34");
    expect(parseKeypadInput("12.3", ".")).toBe("12.3");
    expect(parseKeypadInput("123456789", "1")).toBe("123456789");
    expect(parseKeypadInput("12345678.9", "0")).toBe("12345678.9");
  });

  it("supports clear, backspace, and ignores unknown keys", () => {
    expect(parseKeypadInput("12.5", "clear")).toBe("");
    expect(parseKeypadInput("12.5", "backspace")).toBe("12.");
    expect(parseKeypadInput("0.", "backspace")).toBe("0");
    expect(parseKeypadInput("0", "backspace")).toBe("");
    expect(parseKeypadInput("12", "x")).toBe("12");
  });

  it("converts keypad strings and display parts without float drift", () => {
    expect(centsFromKeypad("12")).toBe(1200);
    expect(centsFromKeypad("12.3")).toBe(1230);
    expect(centsFromKeypad("0.09")).toBe(9);
    expect(centsFromKeypad("")).toBe(0);
    expect(centsFromKeypad("1.234")).toBe(0);
    expect(centsToDisplayParts(123456)).toEqual({
      whole: "1,234",
      fraction: "56",
    });
    expect(centsToDisplayParts(-505)).toEqual({ whole: "-5", fraction: "05" });
  });
});
