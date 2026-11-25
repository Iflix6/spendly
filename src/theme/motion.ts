import { Easing } from "react-native-reanimated";

export const springs = {
  snappy: { damping: 18, stiffness: 220, mass: 1 },
  soft: { damping: 20, stiffness: 140, mass: 1 },
  bouncy: { damping: 12, stiffness: 200, mass: 1 },
} as const;

export const durations = {
  fast: 150,
  base: 250,
  slow: 400,
  chart: 900,
  theme: 300,
  reduced: 120,
} as const;

export const themeSwitchProgress = 0.5;

export const easing = {
  entrance: Easing.bezier(0.2, 0.8, 0.2, 1),
  standard: Easing.out(Easing.cubic),
} as const;

export const splashClockEasing = Easing.linear;

export const splash = {
  nativeFadeDurationMs: 200,
  overlayZIndex: 1000,
  markSize: 96,
  markStrokeWidth: 4,
  contentOffsetY: 24,
  wordmarkGap: 24,
  taglineGap: 8,
  drawDurationMs: 350,
  coinSize: 16,
  coinDropStartMs: 250,
  coinDropDurationMs: 400,
  coinSquashScaleY: 0.85,
  coinSquashDurationMs: 80,
  fillStartMs: 500,
  fillDurationMs: 400,
  fillOpacity: 0.12,
  pulseStartMs: 700,
  pulseScale: 1.06,
  wordmarkStartMs: 700,
  wordmarkDurationMs: 500,
  wordmarkLetterDurationMs: 290,
  wordmarkStaggerMs: 35,
  wordmarkSlide: 12,
  wordmarkFontSize: 32,
  wordmarkLineHeight: 38,
  wordmarkLetterSpacing: 0.6,
  taglineStartMs: 1200,
  taglineDurationMs: 250,
  taglineOpacity: 0.7,
  shimmerStartMs: 1200,
  shimmerDurationMs: 600,
  shimmerOpacity: 0.16,
  shimmerWidthRatio: 1,
  shimmerTravelRatio: 2,
  shimmerFadeInRatio: 0.15,
  shimmerFadeOutRatio: 0.85,
  minimumVisibleMs: 1500,
  maximumVisibleMs: 3000,
  revealDurationMs: 400,
  revealScale: 1.08,
  revealTranslateY: 16,
  reduced: {
    fadeInDurationMs: durations.reduced,
    minimumHoldMs: 500,
    fadeOutDurationMs: 150,
  },
} as const;
