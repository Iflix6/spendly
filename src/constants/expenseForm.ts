export const BOTTOM_SHEET = {
  dismissDistance: 120,
  dismissVelocity: 800,
  backdropOpacity: 0.5,
  maxHeightRatio: 0.92,
  handleWidth: 40,
  handleHeight: 4,
  dragActivation: 12,
  horizontalFailOffset: 16,
} as const;

export const NUMBER_PAD = {
  minKeyHeight: 64,
  pressedScale: 0.92,
  longPressDelayMs: 400,
} as const;

export const DATE_PILL = {
  selectedScale: 0.96,
} as const;

export const AMOUNT_INPUT = {
  popScale: 1.06,
  shakeDistance: 8,
  shakeDurationMs: 200,
  shakeOscillations: 3,
  minimumFontScale: 0.6,
} as const;

export const SAVE_BUTTON = {
  height: 56,
  circleSize: 56,
  pressedScale: 0.98,
  checkDrawDurationMs: 350,
  strokeWidth: 3,
  checkStartX: 16,
  checkStartY: 28,
  checkMiddleX: 24,
  checkMiddleY: 36,
  checkEndX: 40,
  checkEndY: 20,
} as const;

export const DELETE_CONFIRM = {
  timeoutMs: 3000,
} as const;
