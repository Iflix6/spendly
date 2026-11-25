import { SPLASH_MARK_GEOMETRY } from "@/constants/splash";
import {
    createSplashMarkPaths,
    type SplashPathCommand,
} from "@/lib/splashPaths";
import { splash } from "@/theme/motion";
import { describe, expect, it } from "@jest/globals";

function numbersIn(command: SplashPathCommand): number[] {
  return Object.values(command).filter(
    (value): value is number => typeof value === "number",
  );
}

describe("splash mark paths", () => {
  it("returns non-empty Skia path command data", () => {
    const paths = createSplashMarkPaths(splash.markSize);

    expect(paths.body.length).toBeGreaterThan(0);
    expect(paths.slot.length).toBeGreaterThan(0);
    expect(paths.detail.length).toBeGreaterThan(0);
    expect(paths.body.at(-1)?.kind).toBe("close");
  });

  it("scales every coordinate with the requested mark size", () => {
    const base = createSplashMarkPaths(splash.markSize);
    const doubled = createSplashMarkPaths(splash.markSize * 2);

    for (const name of ["body", "slot", "detail"] as const) {
      expect(doubled[name]).toHaveLength(base[name].length);
      doubled[name].forEach((command, index) => {
        const doubledNumbers = numbersIn(command);
        const baseNumbers = numbersIn(base[name][index]);
        doubledNumbers.forEach((value, valueIndex) => {
          expect(value).toBeCloseTo(baseNumbers[valueIndex] * 2);
        });
      });
    }
  });

  it("contains only finite coordinates", () => {
    const sizes = [splash.markSize / 2, splash.markSize, splash.markSize * 2];

    for (const size of sizes) {
      const paths = createSplashMarkPaths(size);
      const commands = [...paths.body, ...paths.slot, ...paths.detail];
      for (const command of commands) {
        for (const value of numbersIn(command)) {
          expect(Number.isFinite(value)).toBe(true);
        }
      }
    }
  });

  it("keeps the coin slot inside the scaled mark", () => {
    const coinX = SPLASH_MARK_GEOMETRY.coinSlotX * splash.markSize;
    const coinY = SPLASH_MARK_GEOMETRY.coinSlotY * splash.markSize;

    expect(coinX).toBeGreaterThan(0);
    expect(coinX).toBeLessThan(splash.markSize);
    expect(coinY).toBeGreaterThan(0);
    expect(coinY).toBeLessThan(splash.markSize);
  });

  it("rejects invalid sizes instead of producing NaN paths", () => {
    expect(() => createSplashMarkPaths(0)).toThrow();
    expect(() => createSplashMarkPaths(Number.NaN)).toThrow();
  });
});
