import {
  resistSwipeTranslation,
  swipeReleaseAction,
} from "@/lib/swipe";
import { SWIPE } from "@/constants/expenses";
import { describe, expect, it } from "@jest/globals";

describe("swipe helpers", () => {
  it("allows rightward movement without revealing an action", () => {
    expect(resistSwipeTranslation(40)).toBe(0);
  });

  it("tracks movement linearly up to the action width", () => {
    expect(resistSwipeTranslation(-48)).toBe(-48);
    expect(resistSwipeTranslation(-SWIPE.actionWidth)).toBe(
      -SWIPE.actionWidth,
    );
  });

  it("adds rubber-band resistance beyond the action width", () => {
    expect(resistSwipeTranslation(-SWIPE.deleteThreshold * 2)).toBe(
      -SWIPE.actionWidth - SWIPE.deleteThreshold / SWIPE.rubberBandDivisor,
    );
  });

  it("settles open at the delete threshold and deletes at the full threshold", () => {
    expect(swipeReleaseAction(-SWIPE.deleteThreshold + 1)).toBe("closed");
    expect(swipeReleaseAction(-SWIPE.deleteThreshold)).toBe("open");
    expect(swipeReleaseAction(-SWIPE.fullDeleteThreshold + 1)).toBe("open");
    expect(swipeReleaseAction(-SWIPE.fullDeleteThreshold)).toBe("delete");
  });
});
