import { useSheetOpenProgressContext } from "@/components/SheetOpenProgressProvider";
import type { SharedValue } from "react-native-reanimated";

export function useSheetOpenProgress(): SharedValue<number> {
  return useSheetOpenProgressContext();
}
