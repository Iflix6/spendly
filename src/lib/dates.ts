import { WEEK_BUCKET_BOUNDARIES } from "@/constants";
import {
    endOfMonth,
    format,
    getDate,
    getDaysInMonth,
    isSameMonth as isSameCalendarMonth,
    isToday,
    isYesterday,
    startOfMonth,
} from "date-fns";

export function dayLabel(date: Date): string {
  if (isToday(date)) {
    return "Today";
  }
  if (isYesterday(date)) {
    return "Yesterday";
  }
  return format(date, "EEE, d MMM");
}

export function isSameMonth(first: Date, second: Date): boolean {
  return isSameCalendarMonth(first, second);
}

export function monthRange(date: Date): { start: Date; end: Date } {
  return { start: startOfMonth(date), end: endOfMonth(date) };
}

export function weekBucket(dayOfMonth: number): number {
  const boundaryIndex = WEEK_BUCKET_BOUNDARIES.findIndex(
    (boundary) => dayOfMonth <= boundary,
  );
  return boundaryIndex >= 0 ? boundaryIndex : WEEK_BUCKET_BOUNDARIES.length;
}

export function toNoonISO(date: Date): string {
  const noon = new Date(date);
  noon.setHours(12, 0, 0, 0);
  return noon.toISOString();
}

export function daysInMonth(date: Date): number {
  return getDaysInMonth(date);
}

export function localDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function dayOfMonth(date: Date): number {
  return getDate(date);
}
