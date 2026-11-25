import {
    CENTS_PER_DOLLAR,
    COMPACT_DECIMALS,
    COMPACT_MILLION_CENTS,
    COMPACT_THOUSAND_CENTS,
    CURRENCY_SYMBOL,
    KEYPAD_MAX_DECIMALS,
    KEYPAD_MAX_DIGITS,
} from "@/constants";

export interface FormatMoneyOptions {
  symbol?: string;
  compact?: boolean;
}

export interface DisplayParts {
  whole: string;
  fraction: string;
}

export function formatMoney(
  cents: number,
  { symbol = CURRENCY_SYMBOL, compact = false }: FormatMoneyOptions = {},
): string {
  const sign = cents < 0 ? "-" : "";
  const absoluteCents = Math.abs(cents);
  const amount = absoluteCents / CENTS_PER_DOLLAR;

  if (compact && absoluteCents >= COMPACT_THOUSAND_CENTS) {
    const divisor =
      absoluteCents >= COMPACT_MILLION_CENTS
        ? COMPACT_MILLION_CENTS
        : COMPACT_THOUSAND_CENTS;
    const suffix = divisor === COMPACT_MILLION_CENTS ? "M" : "k";
    const value = (absoluteCents / divisor).toFixed(COMPACT_DECIMALS);
    return `${sign}${symbol}${value.replace(/\.0$/, "")}${suffix}`;
  }

  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${sign}${symbol}${formatted}`;
}

export function formatMoneySpoken(cents: number): string {
  const safeCents = Number.isFinite(cents) ? Math.abs(Math.trunc(cents)) : 0;
  const dollars = Math.trunc(safeCents / CENTS_PER_DOLLAR);
  const remainingCents = safeCents % CENTS_PER_DOLLAR;
  const parts: string[] = [];

  if (dollars > 0) {
    parts.push(`${dollars} ${dollars === 1 ? "dollar" : "dollars"}`);
  }
  if (remainingCents > 0) {
    parts.push(`${remainingCents} ${remainingCents === 1 ? "cent" : "cents"}`);
  }
  if (parts.length === 0) {
    parts.push("0 dollars");
  }

  const label = parts.join(" ");
  return cents < 0 ? `minus ${label}` : label;
}

export function parseKeypadInput(current: string, key: string): string {
  if (key === "clear") {
    return "";
  }
  if (key === "backspace") {
    if (current === "") {
      return current;
    }
    if (current.length <= 1 || current === "0.") {
      return current === "0" ? "" : "0";
    }
    return current.slice(0, -1);
  }
  if (key === ".") {
    if (current.includes(".")) {
      return current;
    }
    return current === "" ? "0." : `${current}.`;
  }
  if (!/^\d$/.test(key)) {
    return current;
  }

  const digitCount = current.replace(".", "").length;
  if (digitCount >= KEYPAD_MAX_DIGITS) {
    return current;
  }

  const decimalIndex = current.indexOf(".");
  if (
    decimalIndex >= 0 &&
    current.length - decimalIndex - 1 >= KEYPAD_MAX_DECIMALS
  ) {
    return current;
  }
  if (current === "0") {
    return key;
  }
  return `${current}${key}`;
}

export function isRejectedKeypadInput(current: string, key: string): boolean {
  if (key === ".") {
    return current.includes(".");
  }

  if (!/^\d$/.test(key)) {
    return false;
  }

  const digitCount = current.replace(".", "").length;
  if (digitCount >= KEYPAD_MAX_DIGITS) {
    return true;
  }

  const decimalIndex = current.indexOf(".");
  return (
    decimalIndex >= 0 &&
    current.length - decimalIndex - 1 >= KEYPAD_MAX_DECIMALS
  );
}

export function centsFromKeypad(value: string): number {
  if (!/^\d*(?:\.\d{0,2})?$/.test(value)) {
    return 0;
  }
  const [whole = "", fraction = ""] = value.split(".");
  const normalizedFraction = fraction.padEnd(2, "0");
  return Math.round(
    Number(`${whole || "0"}.${normalizedFraction}`) * CENTS_PER_DOLLAR,
  );
}

export function centsToDisplayParts(cents: number): DisplayParts {
  const absoluteCents = Math.abs(Math.trunc(cents));
  const sign = cents < 0 ? "-" : "";
  const whole = Math.trunc(absoluteCents / CENTS_PER_DOLLAR).toLocaleString(
    "en-US",
  );
  const fraction = String(absoluteCents % CENTS_PER_DOLLAR).padStart(2, "0");
  return { whole: `${sign}${whole}`, fraction };
}
