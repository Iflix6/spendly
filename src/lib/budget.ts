import { BUDGET_RING } from "@/constants/home";

export type BudgetStatus = "success" | "warning" | "danger";

export interface BudgetRingState {
  spentCents: number;
  budgetCents: number;
  ratio: number;
  visualRatio: number;
  percentUsed: number;
  percentLabel: string;
  remainingCents: number;
  isOverBudget: boolean;
  hasBudget: boolean;
  status: BudgetStatus;
  colorPosition: number;
}

function sanitizeCents(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

function clampRatio(value: number): number {
  return Math.min(BUDGET_RING.maxVisualRatio, Math.max(0, value));
}

export function getBudgetRingColorPosition(ratio: number): number {
  const safeRatio = Number.isFinite(ratio) ? Math.max(0, ratio) : 0;

  if (safeRatio < BUDGET_RING.warningStartRatio) {
    return 0;
  }

  if (safeRatio >= BUDGET_RING.dangerStartRatio) {
    return BUDGET_RING.maxVisualRatio;
  }

  return (
    (safeRatio - BUDGET_RING.warningStartRatio) /
    (BUDGET_RING.dangerStartRatio - BUDGET_RING.warningStartRatio)
  );
}

export function getBudgetRingState(
  spentCents: number,
  budgetCents: number,
): BudgetRingState {
  const safeSpentCents = sanitizeCents(spentCents);
  const safeBudgetCents = sanitizeCents(budgetCents);
  const hasBudget = safeBudgetCents > 0;
  const isOverBudget = safeSpentCents > safeBudgetCents;
  const ratio = hasBudget
    ? safeSpentCents / safeBudgetCents
    : safeSpentCents > 0
      ? BUDGET_RING.maxVisualRatio
      : 0;
  const visualRatio = clampRatio(ratio);
  const percentUsed = hasBudget ? ratio * 100 : 0;
  const status: BudgetStatus =
    ratio >= BUDGET_RING.dangerStartRatio
      ? "danger"
      : ratio >= BUDGET_RING.warningStartRatio
        ? "warning"
        : "success";

  return {
    spentCents: safeSpentCents,
    budgetCents: safeBudgetCents,
    ratio,
    visualRatio,
    percentUsed,
    percentLabel: hasBudget ? `${Math.round(percentUsed)}%` : "—",
    remainingCents: safeBudgetCents - safeSpentCents,
    isOverBudget,
    hasBudget,
    status,
    colorPosition: getBudgetRingColorPosition(ratio),
  };
}
