export const CURRENCY_SYMBOL = "$";
export const DEFAULT_BUDGET_CENTS = 150000;
export const NOTE_MAX = 80;

export const CENTS_PER_DOLLAR = 100;
export const MIN_BUDGET_CENTS = CENTS_PER_DOLLAR;
export const KEYPAD_MAX_DIGITS = 9;
export const KEYPAD_MAX_DECIMALS = 2;
export const PERCENT_PRECISION = 1;
export const COMPACT_THOUSAND_CENTS = 100000;
export const COMPACT_MILLION_CENTS = 100000000;
export const COMPACT_DECIMALS = 1;
export const ID_RADIX = 36;
export const ID_RANDOM_LENGTH = 8;
export const DEFAULT_THEME_MODE = "light" as const;

export const STORE_KEY = "spendly.expense-store.v1";
export const STORE_VERSION = 2;
export const WEEK_BUCKET_BOUNDARIES = [7, 14, 21, 28] as const;

export const MULBERRY32 = {
  addend: 0x6d2b79f5,
  firstMultiplier: 0x85ebca6b,
  secondMultiplier: 0xc2b2ae35,
  divisor: 4294967296,
} as const;

export const SEED_CONFIG = {
  randomSeed: 42,
  previousExpenseCount: 40,
  currentExpenseCount: 38,
  matureStartDay: 15,
  earlyTargetFraction: 0.75,
  matureMinFraction: 0.75,
  matureMaxFraction: 0.8,
  previousEarlyFraction: 0.78,
  previousMonthMultiplier: 1.08,
} as const;
