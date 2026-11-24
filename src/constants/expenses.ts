export const EXPENSE_SEARCH_DEBOUNCE_MS = 150;

export const CATEGORY_ICON = {
  defaultSize: 40,
  iconScale: 0.5,
} as const;

export const SEARCH_BAR = {
  height: 52,
  iconSize: 20,
} as const;

export const CATEGORY_CHIP = {
  selectedScale: 0.96,
} as const;

export const EXPENSE_LIST_MOTION = {
  initialStaggerCount: 8,
  staggerStepMs: 40,
  initialNumToRender: 12,
} as const;

export const EXPENSE_ROW = {
  minHeight: 76,
  pressedScale: 0.98,
} as const;

export const SWIPE = {
  actionWidth: 96,
  deleteThreshold: 96,
  fullDeleteThreshold: 180,
  activationOffset: 12,
  verticalFailOffset: 12,
  rubberBandDivisor: 3,
  iconSize: 24,
} as const;

export const SNACKBAR = {
  autoDismissMs: 4000,
  minHeight: 56,
} as const;

export const EMPTY_STATE = {
  canvasWidth: 180,
  canvasHeight: 140,
  floatDistance: 6,
  receiptX: 34,
  receiptY: 12,
  receiptWidth: 72,
  receiptHeight: 96,
  receiptRadius: 12,
  walletX: 48,
  walletY: 52,
  walletWidth: 108,
  walletHeight: 64,
  walletRadius: 18,
  pocketX: 96,
  pocketY: 70,
  pocketWidth: 48,
  pocketHeight: 28,
  pocketRadius: 10,
  coinX: 142,
  coinY: 40,
  coinRadius: 14,
  lineStartX: 50,
  lineEndX: 90,
  firstLineY: 40,
  secondLineY: 52,
  claspX: 114,
  claspY: 84,
  claspRadius: 4,
  haloRadius: 58,
  lineStrokeWidth: 2,
} as const;
