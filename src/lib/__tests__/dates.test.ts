import {
    dayLabel,
    daysInMonth,
    isSameMonth,
    monthRange,
    toNoonISO,
    weekBucket,
} from "@/lib/dates";
import { afterEach, describe, expect, it, jest } from "@jest/globals";

afterEach(() => {
  jest.useRealTimers();
});

describe("dates", () => {
  it("labels today, yesterday, and other local days", () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 9, 12, 12));
    expect(dayLabel(new Date(2026, 9, 12, 9))).toBe("Today");
    expect(dayLabel(new Date(2026, 9, 11, 9))).toBe("Yesterday");
    expect(dayLabel(new Date(2026, 9, 10, 9))).toBe("Sat, 10 Oct");
  });

  it("compares month and year boundaries", () => {
    expect(isSameMonth(new Date(2026, 9, 1), new Date(2026, 9, 31))).toBe(true);
    expect(isSameMonth(new Date(2026, 9, 31), new Date(2026, 10, 1))).toBe(
      false,
    );
    expect(isSameMonth(new Date(2026, 0, 1), new Date(2025, 0, 1))).toBe(false);
  });

  it.each([
    [new Date(2026, 1, 10), 28],
    [new Date(2024, 1, 10), 29],
    [new Date(2026, 3, 10), 30],
    [new Date(2026, 11, 10), 31],
  ])("returns exact month ranges for %s", (date, expectedDays) => {
    const range = monthRange(date);
    expect(range.start.getDate()).toBe(1);
    expect(range.start.getHours()).toBe(0);
    expect(range.end.getDate()).toBe(expectedDays);
    expect(daysInMonth(date)).toBe(expectedDays);
  });

  it.each([
    [1, 0],
    [7, 0],
    [8, 1],
    [14, 1],
    [15, 2],
    [21, 2],
    [22, 3],
    [28, 3],
    [29, 4],
    [30, 4],
    [31, 4],
  ])("maps day %i to week bucket %i", (day, bucket) => {
    expect(weekBucket(day)).toBe(bucket);
  });

  it("serializes local noon without changing the local calendar day", () => {
    const date = new Date(2026, 9, 12, 23, 45);
    const iso = toNoonISO(date);
    const parsed = new Date(iso);
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(9);
    expect(parsed.getDate()).toBe(12);
    expect(parsed.getHours()).toBe(12);
    expect(parsed.getMinutes()).toBe(0);
  });
});
