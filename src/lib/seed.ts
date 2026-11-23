import { getDate, getDaysInMonth, startOfMonth, subMonths } from 'date-fns';
import {
  DEFAULT_BUDGET_CENTS,
  MULBERRY32,
  NOTE_MAX,
  SEED_CONFIG,
} from '@/constants';
import {
  CATEGORY_IDS,
  CATEGORY_SEED_WEIGHTS,
  CATEGORY_SPEND_RANGES,
  FIXED_MONTHLY_BILLS,
  type CategoryId,
} from '@/constants/categories';
import type { Expense } from '@/store/useExpenseStore';
import { toNoonISO } from './dates';

type Random = () => number;

interface SeedDraft {
  categoryId: CategoryId;
  note: string;
  amountCents: number;
  day: number;
  fixed: boolean;
}

const NOTES: Record<CategoryId, readonly string[]> = {
  food: [
    'Lunch at Mama Put',
    'Groceries',
    'Breakfast',
    'Zobo and snacks',
    'Fruit market',
    'Dinner with friends',
  ],
  transport: [
    'Uber to office',
    'Bolt ride',
    'Fuel',
    'Bus fare',
    'Keke to market',
  ],
  shopping: [
    'New sneakers',
    'T-shirt',
    'Headphones',
    'Skincare',
    'Home supplies',
  ],
  bills: [
    'Phone bill',
    'Water bill',
    'Data subscription',
    'Household supplies',
  ],
  fun: [
    'Cinema tickets',
    'Night out',
    'Bowling',
    'Concert tickets',
    'Weekend hangout',
  ],
  health: [
    'Pharmacy',
    'Clinic visit',
    'Vitamins',
    'Lab tests',
    'First-aid supplies',
  ],
};

function mulberry32(seed: number): Random {
  let value = seed;
  return () => {
    value += MULBERRY32.addend;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / MULBERRY32.divisor;
  };
}

function randomInt(random: Random, min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

function pickNote(random: Random, categoryId: CategoryId): string {
  const notes = NOTES[categoryId];
  return notes[Math.floor(random() * notes.length)].slice(0, NOTE_MAX);
}

function pickCategory(random: Random): CategoryId {
  let roll = random();
  for (const categoryId of CATEGORY_IDS) {
    roll -= CATEGORY_SEED_WEIGHTS[categoryId];
    if (roll <= 0) {
      return categoryId;
    }
  }
  return CATEGORY_IDS[CATEGORY_IDS.length - 1];
}

function sum(
  drafts: readonly SeedDraft[],
  field: 'amountCents' | 'minCents' | 'maxCents'
): number {
  return drafts.reduce(
    (total, draft) =>
      field === 'amountCents'
        ? total + draft.amountCents
        : total + CATEGORY_SPEND_RANGES[draft.categoryId][field],
    0
  );
}

function buildMonth(
  random: Random,
  month: Date,
  lastDay: number,
  expenseCount: number,
  targetCents: number,
  idPrefix: string
): Expense[] {
  const drafts: SeedDraft[] = FIXED_MONTHLY_BILLS.filter(
    (bill) => bill.day <= lastDay
  ).map((bill) => ({ ...bill, fixed: true }));

  const variableCount = Math.max(0, expenseCount - drafts.length);
  for (let index = 0; index < variableCount; index += 1) {
    const categoryId = index < CATEGORY_IDS.length
      ? CATEGORY_IDS[index]
      : pickCategory(random);
    const range = CATEGORY_SPEND_RANGES[categoryId];
    drafts.push({
      categoryId,
      note: pickNote(random, categoryId),
      amountCents: randomInt(random, range.minCents, range.maxCents),
      day: randomInt(random, 1, lastDay),
      fixed: false,
    });
  }

  const fixedDrafts = drafts.filter((draft) => draft.fixed);
  const variableDrafts = drafts.filter((draft) => !draft.fixed);
  const fixedTotal = sum(fixedDrafts, 'amountCents');
  const variableMin = sum(variableDrafts, 'minCents');
  const variableMax = sum(variableDrafts, 'maxCents');
  const minimumTotal = fixedTotal + variableMin;
  const maximumTotal = fixedTotal + variableMax;
  const feasibleTarget = Math.min(
    maximumTotal,
    Math.max(minimumTotal, Math.round(targetCents))
  );
  const variableTarget = feasibleTarget - fixedTotal;
  const rawVariableTotal = sum(variableDrafts, 'amountCents');
  const scale = rawVariableTotal > 0 ? variableTarget / rawVariableTotal : 1;

  for (const draft of variableDrafts) {
    const range = CATEGORY_SPEND_RANGES[draft.categoryId];
    draft.amountCents = Math.min(
      range.maxCents,
      Math.max(range.minCents, Math.round(draft.amountCents * scale))
    );
  }

  let remaining = variableTarget - sum(variableDrafts, 'amountCents');
  for (const draft of variableDrafts) {
    if (remaining === 0) {
      break;
    }
    const range = CATEGORY_SPEND_RANGES[draft.categoryId];
    const adjustment = remaining > 0
      ? Math.min(remaining, range.maxCents - draft.amountCents)
      : -Math.min(-remaining, draft.amountCents - range.minCents);
    draft.amountCents += adjustment;
    remaining -= adjustment;
  }

  return drafts
    .map((draft, index) => {
      const date = new Date(
        month.getFullYear(),
        month.getMonth(),
        draft.day,
        12
      );
      return {
        id: `seed-${idPrefix}-${index}`,
        amountCents: draft.amountCents,
        categoryId: draft.categoryId,
        date: toNoonISO(date),
        note: draft.note,
        createdAt: date.getTime() + index,
      } satisfies Expense;
    })
    .sort(
      (first, second) =>
        second.date.localeCompare(first.date) ||
        second.createdAt - first.createdAt
    );
}

export function generateSeed(today: Date): Expense[] {
  const currentMonth = startOfMonth(today);
  const previousMonth = subMonths(currentMonth, 1);
  const day = getDate(today);
  const daysThisMonth = getDaysInMonth(today);
  const matureDays = Math.max(1, daysThisMonth - SEED_CONFIG.matureStartDay);
  const currentFraction = day <= SEED_CONFIG.matureStartDay
    ? SEED_CONFIG.earlyTargetFraction * (day / SEED_CONFIG.matureStartDay)
    : SEED_CONFIG.matureMinFraction +
      (SEED_CONFIG.matureMaxFraction - SEED_CONFIG.matureMinFraction) *
        ((day - SEED_CONFIG.matureStartDay) / matureDays);
  const previousFraction = day >= SEED_CONFIG.matureStartDay
    ? currentFraction * SEED_CONFIG.previousMonthMultiplier
    : SEED_CONFIG.previousEarlyFraction;
  const currentCount = Math.max(
    1,
    Math.round(SEED_CONFIG.currentExpenseCount * (day / daysThisMonth))
  );
  const random = mulberry32(SEED_CONFIG.randomSeed);

  const previous = buildMonth(
    random,
    previousMonth,
    getDaysInMonth(previousMonth),
    SEED_CONFIG.previousExpenseCount,
    DEFAULT_BUDGET_CENTS * previousFraction,
    'previous'
  );
  const current = buildMonth(
    random,
    currentMonth,
    day,
    currentCount,
    DEFAULT_BUDGET_CENTS * currentFraction,
    'current'
  );

  return [...previous, ...current].sort(
    (first, second) =>
      second.date.localeCompare(first.date) ||
      second.createdAt - first.createdAt
  );
}
