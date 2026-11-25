import { CENTS_PER_DOLLAR } from "@/constants";
import { localDateKey } from "@/lib/dates";

export type DatePreset = "today" | "yesterday" | "custom";

export function keypadValueFromCents(cents: number): string {
  if (!Number.isFinite(cents) || cents <= 0) {
    return "";
  }

  const absoluteCents = Math.trunc(cents);
  const whole = Math.floor(absoluteCents / CENTS_PER_DOLLAR);
  const fraction = absoluteCents % CENTS_PER_DOLLAR;

  if (fraction === 0) {
    return String(whole);
  }

  return `${whole}.${String(fraction).padStart(2, "0").replace(/0$/, "")}`;
}

export function formatKeypadDisplay(value: string): string {
  const [whole = "", fraction] = value.split(".");
  const groupedWhole = (whole || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return value.includes(".") ? `${groupedWhole}.${fraction}` : groupedWhole;
}

export function datePreset(date: Date, now = new Date()): DatePreset {
  const key = localDateKey(date);

  if (key === localDateKey(now)) {
    return "today";
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return key === localDateKey(yesterday) ? "yesterday" : "custom";
}
