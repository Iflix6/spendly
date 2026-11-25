export const STATS_SCREEN = {
  amountMaxFontScale: 1.15,
  cardPadding: 20,
  emptyCardMinHeight: 280,
} as const;

export const DELTA_PILL = {
  minHeight: 32,
  horizontalPadding: 12,
  iconSize: 16,
} as const;

export const DONUT_CHART = {
  defaultSize: 224,
  minSize: 176,
  maxSize: 248,
  strokeWidth: 28,
  gapAngleDegrees: 4,
  minVisibleAngleDegrees: 8,
  fullCircleDegrees: 360,
  startAngleDegrees: -90,
  selectedOffset: 6,
  dimmedOpacity: 0.4,
  legendStaggerMs: 40,
} as const;

export const BAR_CHART = {
  height: 208,
  topPadding: 16,
  bottomPadding: 32,
  axisLabelWidth: 48,
  rightPadding: 12,
  daySlotWidth: 20,
  barWidthRatio: 0.56,
  maxBarWidth: 40,
  cornerRadius: 6,
  gridLineCount: 3,
  niceSteps: [1, 2, 2.5, 5, 10],
  growStaggerMs: 20,
  nonTallestOpacity: 0.55,
  todayHighlightOpacity: 0.12,
  zeroMaxCents: 100,
  tooltipWidth: 132,
  tooltipHeight: 48,
  tooltipGap: 8,
} as const;
