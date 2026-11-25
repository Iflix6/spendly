import { Snackbar } from "@/components/Snackbar";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { spacing } from "@/theme/tokens";
import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";

export interface SnackbarOptions {
  message: string;
  actionLabel: string;
  onAction: () => void;
}

interface ActiveSnackbar extends SnackbarOptions {
  id: number;
}

interface SnackbarContextValue {
  showSnackbar: (options: SnackbarOptions) => void;
}

const SnackbarContext = createContext<SnackbarContextValue | undefined>(
  undefined,
);

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [snackbar, setSnackbar] = useState<ActiveSnackbar | null>(null);
  const snackbarId = useRef(0);
  const bottomOffset = useTabBarHeight() - spacing.xl;

  const showSnackbar = useCallback((options: SnackbarOptions) => {
    snackbarId.current += 1;
    setSnackbar({ ...options, id: snackbarId.current });
  }, []);

  const dismissSnackbar = useCallback(() => {
    setSnackbar(null);
  }, []);

  const handleAction = useCallback(() => {
    if (!snackbar) {
      return;
    }

    setSnackbar(null);
    snackbar.onAction();
  }, [snackbar]);

  const value = useMemo(() => ({ showSnackbar }), [showSnackbar]);

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      {snackbar ? (
        <Snackbar
          key={snackbar.id}
          message={snackbar.message}
          actionLabel={snackbar.actionLabel}
          onAction={handleAction}
          onDismiss={dismissSnackbar}
          bottomOffset={bottomOffset}
        />
      ) : null}
    </SnackbarContext.Provider>
  );
}

export function useSnackbar(): SnackbarContextValue {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error("useSnackbar must be used within SnackbarProvider");
  }

  return context;
}
