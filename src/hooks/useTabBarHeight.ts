import { TAB_BAR } from "@/constants/navigation";
import { spacing } from "@/theme/tokens";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function useTabBarHeight(): number {
  const insets = useSafeAreaInsets();

  return TAB_BAR.height + TAB_BAR.bottomMargin + insets.bottom + spacing.xl;
}
