import { getSplashRevealDurationMs, shouldRevealSplash } from "@/lib/splash";
import { splash } from "@/theme/motion";
import { describe, expect, it } from "@jest/globals";

describe("splash reveal readiness", () => {
  it("waits for the minimum duration when the app is ready early", () => {
    expect(
      shouldRevealSplash({
        isAppReady: true,
        elapsedMs: splash.minimumVisibleMs - 1,
        reduceMotion: false,
      }),
    ).toBe(false);
    expect(
      shouldRevealSplash({
        isAppReady: true,
        elapsedMs: splash.minimumVisibleMs,
        reduceMotion: false,
      }),
    ).toBe(true);
  });

  it("waits for readiness until the hard reveal deadline", () => {
    expect(
      shouldRevealSplash({
        isAppReady: false,
        elapsedMs: splash.maximumVisibleMs - splash.revealDurationMs - 1,
        reduceMotion: false,
      }),
    ).toBe(false);
  });

  it("starts the reveal at the deadline even if readiness stalls", () => {
    expect(
      shouldRevealSplash({
        isAppReady: false,
        elapsedMs: splash.maximumVisibleMs - splash.revealDurationMs,
        reduceMotion: false,
      }),
    ).toBe(true);
  });

  it("reveals immediately when readiness arrives after the cap", () => {
    expect(
      shouldRevealSplash({
        isAppReady: true,
        elapsedMs: splash.maximumVisibleMs + 1,
        reduceMotion: false,
      }),
    ).toBe(true);
  });

  it("fits the normal and reduced-motion reveals inside the total cap", () => {
    const normalStartMs = splash.minimumVisibleMs;
    const reducedStartMs = splash.reduced.minimumHoldMs;

    expect(
      normalStartMs +
        getSplashRevealDurationMs({
          elapsedMs: normalStartMs,
          reduceMotion: false,
        }),
    ).toBeLessThanOrEqual(splash.maximumVisibleMs);
    expect(
      reducedStartMs +
        getSplashRevealDurationMs({
          elapsedMs: reducedStartMs,
          reduceMotion: true,
        }),
    ).toBeLessThanOrEqual(splash.maximumVisibleMs);
  });

  it("shortens a delayed reveal and finishes immediately at the cap", () => {
    const elapsedMs = splash.maximumVisibleMs - splash.revealDurationMs / 2;

    expect(getSplashRevealDurationMs({ elapsedMs, reduceMotion: false })).toBe(
      splash.maximumVisibleMs - elapsedMs,
    );
    expect(
      getSplashRevealDurationMs({
        elapsedMs: splash.maximumVisibleMs,
        reduceMotion: false,
      }),
    ).toBe(0);
    expect(
      getSplashRevealDurationMs({
        elapsedMs: splash.maximumVisibleMs + 1,
        reduceMotion: true,
      }),
    ).toBe(0);
  });

  it("uses the shorter reduced-motion hold", () => {
    expect(
      shouldRevealSplash({
        isAppReady: true,
        elapsedMs: splash.reduced.minimumHoldMs - 1,
        reduceMotion: true,
      }),
    ).toBe(false);
    expect(
      shouldRevealSplash({
        isAppReady: true,
        elapsedMs: splash.reduced.minimumHoldMs,
        reduceMotion: true,
      }),
    ).toBe(true);
  });

  it("still waits for readiness in reduced-motion mode before its deadline", () => {
    expect(
      shouldRevealSplash({
        isAppReady: false,
        elapsedMs:
          splash.maximumVisibleMs - splash.reduced.fadeOutDurationMs - 1,
        reduceMotion: true,
      }),
    ).toBe(false);
  });
});
