import {
    getBarHitArea,
    getBarWidth,
    getDonutSlices,
    getNiceMax,
    hitTestBar,
    hitTestDonut,
} from "@/lib/chartGeometry";
import { describe, expect, it } from "@jest/globals";

describe("chart geometry", () => {
  it("creates proportional donut arcs with gaps between slices", () => {
    const slices = getDonutSlices(
      [
        { key: "food", value: 75 },
        { key: "transport", value: 25 },
      ],
      6,
      0,
    );

    expect(slices).toHaveLength(2);
    expect(slices[0].startAngle).toBe(-90);
    expect(slices[0].sweepAngle).toBeCloseTo(265.5);
    expect(slices[1].startAngle).toBeCloseTo(181.5);
    expect(slices[1].endAngle).toBeCloseTo(270);
  });

  it("draws a single-category month as a full ring without a gap", () => {
    const slices = getDonutSlices([{ key: "food", value: 500 }], 8, 8);

    expect(slices).toHaveLength(1);
    expect(slices[0].startAngle).toBe(-90);
    expect(slices[0].endAngle).toBe(270);
    expect(slices[0].sweepAngle).toBe(360);
  });

  it("keeps tiny slices visible with a minimum angle", () => {
    const slices = getDonutSlices(
      [
        { key: "food", value: 999 },
        { key: "fun", value: 1 },
      ],
      4,
      12,
    );

    expect(slices[1].sweepAngle).toBeCloseTo(12);
    expect(slices[0].sweepAngle + slices[1].sweepAngle).toBeCloseTo(356);
  });

  it("ignores empty and invalid donut values", () => {
    expect(
      getDonutSlices([
        { key: "food", value: 0 },
        { key: "fun", value: Number.NaN },
      ]),
    ).toEqual([]);
  });

  it("hit-tests a donut slice by angle and ring radius", () => {
    const slices = getDonutSlices(
      [
        { key: "food", value: 50 },
        { key: "transport", value: 50 },
      ],
      4,
      0,
    );

    expect(
      hitTestDonut({ x: 100, y: 20 }, { x: 100, y: 100 }, 50, 90, slices),
    ).toBe("food");
    expect(
      hitTestDonut({ x: 20, y: 100 }, { x: 100, y: 100 }, 50, 90, slices),
    ).toBe("transport");
    expect(
      hitTestDonut({ x: 100, y: 100 }, { x: 100, y: 100 }, 50, 90, slices),
    ).toBeNull();
    expect(
      hitTestDonut({ x: 100, y: 5 }, { x: 100, y: 100 }, 50, 90, slices),
    ).toBeNull();
  });

  it("rounds the bar maximum up to a nice three-step value", () => {
    expect(getNiceMax(12345)).toBe(15000);
    expect(getNiceMax(6000)).toBe(6000);
    expect(getNiceMax(1)).toBe(2);
    expect(getNiceMax(0)).toBe(0);
    expect(getNiceMax(Number.NaN)).toBe(0);
  });

  it("hit-tests bar columns and rejects taps outside the plot", () => {
    const area = getBarHitArea(0, 100, 10, 200, 5);

    expect(hitTestBar({ x: 10, y: 100 }, 5, area)).toBe(0);
    expect(hitTestBar({ x: 95, y: 100 }, 5, area)).toBe(4);
    expect(hitTestBar({ x: 100, y: 100 }, 5, area)).toBeNull();
    expect(hitTestBar({ x: 10, y: 5 }, 5, area)).toBeNull();
  });

  it("keeps bar widths inside their available slots", () => {
    expect(getBarWidth(20)).toBeCloseTo(11.2);
    expect(getBarWidth(100)).toBe(40);
  });
});
