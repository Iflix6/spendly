import { SNACKBAR } from "@/constants/expenses";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { durations } from "@/theme/motion";
import { useTheme } from "@/theme/ThemeProvider";
import {
  fontFamily,
  layout,
  lightCardShadow,
  radii,
  spacing,
  typography,
} from "@/theme/tokens";
import { useEffect, useMemo } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  FadeOutDown,
  SlideInUp,
} from "react-native-reanimated";

interface SnackbarProps {
  message: string;
  actionLabel: string;
  onAction: () => void;
  onDismiss: () => void;
  bottomOffset: number;
}

const styles = StyleSheet.create({
  snackbar: {
    position: "absolute",
    left: spacing.base,
    right: spacing.base,
    bottom: 0,
    minHeight: SNACKBAR.minHeight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: spacing.base,
    paddingRight: spacing.sm,
    gap: spacing.base,
    borderRadius: radii.card,
    borderWidth: layout.borderWidth,
  },
  message: {
    ...typography.body,
    flex: 1,
  },
  action: {
    minWidth: layout.minTouchTarget,
    minHeight: layout.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  actionLabel: {
    ...typography.body,
    fontFamily: fontFamily.semibold,
  },
});

export function Snackbar({
  message,
  actionLabel,
  onAction,
  onDismiss,
  bottomOffset,
}: SnackbarProps) {
  const { colors, isDark } = useTheme();
  const reduceMotion = useReducedMotionSafe();

  useEffect(() => {
    const timeout = setTimeout(onDismiss, SNACKBAR.autoDismissMs);
    return () => clearTimeout(timeout);
  }, [onDismiss]);

  const snackbarStyle = useMemo(
    () => [
      styles.snackbar,
      {
        bottom: bottomOffset,
        backgroundColor: colors.surface,
        borderColor: isDark ? colors.border : colors.surface,
      },
      isDark ? null : lightCardShadow,
    ],
    [bottomOffset, colors.border, colors.surface, isDark],
  );
  const messageStyle = useMemo(
    () => [styles.message, { color: colors.text }],
    [colors.text],
  );
  const actionLabelStyle = useMemo(
    () => [styles.actionLabel, { color: colors.accent }],
    [colors.accent],
  );
  const entering = reduceMotion
    ? FadeIn.duration(durations.reduced)
    : SlideInUp.duration(durations.base);
  const exiting = reduceMotion
    ? FadeOut.duration(durations.reduced)
    : FadeOutDown.duration(durations.fast);

  return (
    <Animated.View
      style={snackbarStyle}
      entering={entering}
      exiting={exiting}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text style={messageStyle} numberOfLines={2}>
        {message}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
        onPress={onAction}
        style={styles.action}
      >
        <Text style={actionLabelStyle}>{actionLabel}</Text>
      </Pressable>
    </Animated.View>
  );
}
