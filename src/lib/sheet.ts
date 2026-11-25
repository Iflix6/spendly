import { BOTTOM_SHEET } from "@/constants/expenseForm";

export function shouldDismissSheet(
  translationY: number,
  velocityY: number,
): boolean {
  "worklet";

  return (
    translationY > BOTTOM_SHEET.dismissDistance ||
    velocityY > BOTTOM_SHEET.dismissVelocity
  );
}
