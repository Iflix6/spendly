import { SWIPE } from "@/constants/expenses";

export type SwipeReleaseAction = "open" | "delete" | "closed";

export function resistSwipeTranslation(translationX: number): number {
  const leftTranslation = Math.min(0, translationX);

  if (leftTranslation >= -SWIPE.actionWidth) {
    return leftTranslation;
  }

  return (
    -SWIPE.actionWidth -
    (-leftTranslation - SWIPE.actionWidth) / SWIPE.rubberBandDivisor
  );
}

export function swipeReleaseAction(translationX: number): SwipeReleaseAction {
  const leftTranslation = Math.min(0, translationX);

  if (leftTranslation <= -SWIPE.fullDeleteThreshold) {
    return "delete";
  }

  if (leftTranslation <= -SWIPE.deleteThreshold) {
    return "open";
  }

  return "closed";
}
