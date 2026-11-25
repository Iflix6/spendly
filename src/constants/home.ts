export const ANIMATED_NUMBER = {
  digitCount: 10,
  defaultFractionDigits: 2,
  lineHeightRatio: 1.2,
  estimatedGlyphWidthRatio: 0.6,
  minimumFontScale: 0.4,
} as const;

export const BUDGET_RING = {
  defaultSize: 96,
  strokeWidth: 8,
  startAngleDegrees: -90,
  fullCircleDegrees: 360,
  maxVisualRatio: 1,
  warningStartRatio: 0.7,
  dangerStartRatio: 0.9,
  pulseScale: 1.04,
} as const;

export const HOME = {
  recentLimit: 5,
  entranceStaggerMs: 60,
  amountMaxFontScale: 1.15,
} as const;

export const CATEGORY_CARD = {
  minHeight: 116,
  progressHeight: 4,
  pressedScale: 0.97,
} as const;

export const SETTINGS_SHEET = {
  resetConfirmTimeoutMs: 3000,
} as const;
