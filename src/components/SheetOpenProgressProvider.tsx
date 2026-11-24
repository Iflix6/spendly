import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useSharedValue, type SharedValue } from "react-native-reanimated";

export const SheetOpenProgressContext = createContext<
  SharedValue<number> | undefined
>(undefined);

export function SheetOpenProgressProvider({
  children,
}: {
  children: ReactNode;
}) {
  const sheetOpenProgress = useSharedValue(0);
  const value = useMemo(() => sheetOpenProgress, [sheetOpenProgress]);

  return (
    <SheetOpenProgressContext.Provider value={value}>
      {children}
    </SheetOpenProgressContext.Provider>
  );
}

export function useSheetOpenProgressContext(): SharedValue<number> {
  const context = useContext(SheetOpenProgressContext);
  if (!context) {
    throw new Error(
      "useSheetOpenProgressContext must be used within SheetOpenProgressProvider",
    );
  }
  return context;
}
