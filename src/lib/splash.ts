import { splash } from "@/theme/motion";

export interface SplashRevealState {
  isAppReady: boolean;
  elapsedMs: number;
  reduceMotion: boolean;
}

export interface SplashRevealDurationState {
  elapsedMs: number;
  reduceMotion: boolean;
}

function getConfiguredRevealDurationMs(reduceMotion: boolean): number {
  "worklet";

  return reduceMotion
    ? splash.reduced.fadeOutDurationMs
    : splash.revealDurationMs;
}

export function getSplashRevealDurationMs({
  elapsedMs,
  reduceMotion,
}: SplashRevealDurationState): number {
  "worklet";

  const remainingMs = splash.maximumVisibleMs - elapsedMs;

  return Math.max(
    0,
    Math.min(getConfiguredRevealDurationMs(reduceMotion), remainingMs),
  );
}

export function shouldRevealSplash({
  isAppReady,
  elapsedMs,
  reduceMotion,
}: SplashRevealState): boolean {
  "worklet";

  const minimumVisibleMs = reduceMotion
    ? splash.reduced.minimumHoldMs
    : splash.minimumVisibleMs;
  const latestRevealStartMs =
    splash.maximumVisibleMs - getConfiguredRevealDurationMs(reduceMotion);

  return (
    (isAppReady && elapsedMs >= minimumVisibleMs) ||
    elapsedMs >= latestRevealStartMs
  );
}
