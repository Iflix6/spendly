import { BOTTOM_SHEET } from "@/constants/expenseForm";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { useSheetOpenProgress } from "@/hooks/useSheetOpenProgress";
import { shouldDismissSheet } from "@/lib/sheet";
import { durations, easing, springs } from "@/theme/motion";
import { useAnimatedThemeColors, useTheme } from "@/theme/ThemeProvider";
import { layout, lightCardShadow, radii, spacing } from "@/theme/tokens";
import {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    type ReactNode,
} from "react";
import {
    Keyboard,
    Pressable,
    StyleSheet,
    View,
    useWindowDimensions,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    cancelAnimation,
    runOnJS,
    useAnimatedReaction,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    type SharedValue,
} from "react-native-reanimated";

export interface BottomSheetHandle {
  dismiss: () => void;
}

interface BottomSheetProps {
  children: ReactNode;
  onDismiss: () => void;
  keyboardOffset?: SharedValue<number>;
  dismissEnabled?: boolean;
  dismissLabel?: string;
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    borderWidth: layout.borderWidth,
    overflow: "hidden",
  },
  handleArea: {
    height: spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
  },
  handle: {
    width: BOTTOM_SHEET.handleWidth,
    height: BOTTOM_SHEET.handleHeight,
    borderRadius: radii.pill,
  },
  content: {
    flexShrink: 1,
  },
});

export const BottomSheet = forwardRef<BottomSheetHandle, BottomSheetProps>(
  function BottomSheet(
    {
      children,
      onDismiss,
      keyboardOffset,
      dismissEnabled = true,
      dismissLabel = "Dismiss expense sheet",
    },
    ref,
  ) {
    const { isDark } = useTheme();
    const animatedColors = useAnimatedThemeColors();
    const reduceMotion = useReducedMotionSafe();
    const { height: windowHeight } = useWindowDimensions();
    const sheetOpenProgress = useSheetOpenProgress();
    const translateY = useSharedValue(windowHeight);
    const startY = useSharedValue(0);
    const isDismissing = useRef(false);

    const finishDismiss = useCallback(() => {
      onDismiss();
    }, [onDismiss]);

    const requestDismiss = useCallback(() => {
      if (isDismissing.current) {
        return;
      }

      isDismissing.current = true;
      Keyboard.dismiss();

      if (reduceMotion) {
        translateY.value = windowHeight;
        finishDismiss();
        return;
      }

      translateY.value = withTiming(
        windowHeight,
        { duration: durations.base, easing: easing.standard },
        (finished) => {
          "worklet";
          if (finished) {
            runOnJS(finishDismiss)();
          }
        },
      );
    }, [finishDismiss, reduceMotion, translateY, windowHeight]);

    useEffect(() => {
      if (reduceMotion) {
        translateY.value = 0;
        return;
      }

      translateY.value = withSpring(0, springs.soft);
    }, [reduceMotion, translateY]);

    useEffect(() => {
      return () => {
        sheetOpenProgress.value = 0;
      };
    }, [sheetOpenProgress]);

    useAnimatedReaction(
      () => {
        "worklet";
        return Math.min(1, Math.max(0, 1 - translateY.value / windowHeight));
      },
      (progress, previous) => {
        "worklet";
        if (progress !== previous) {
          sheetOpenProgress.value = progress;
        }
      },
    );

    const panGesture = useMemo(
      () =>
        Gesture.Pan()
          .enabled(dismissEnabled)
          .activeOffsetY(BOTTOM_SHEET.dragActivation)
          .failOffsetX([
            -BOTTOM_SHEET.horizontalFailOffset,
            BOTTOM_SHEET.horizontalFailOffset,
          ])
          .onStart(() => {
            "worklet";
            cancelAnimation(translateY);
            startY.value = translateY.value;
          })
          .onUpdate((event) => {
            "worklet";
            translateY.value = Math.max(0, startY.value + event.translationY);
          })
          .onEnd((event, success) => {
            "worklet";
            const nextTranslation = Math.max(
              0,
              startY.value + event.translationY,
            );

            if (
              success &&
              shouldDismissSheet(nextTranslation, event.velocityY)
            ) {
              runOnJS(requestDismiss)();
              return;
            }

            translateY.value = reduceMotion ? 0 : withSpring(0, springs.soft);
          }),
      [dismissEnabled, reduceMotion, requestDismiss, startY, translateY],
    );

    useImperativeHandle(ref, () => ({ dismiss: requestDismiss }), [
      requestDismiss,
    ]);

    const backdropStyle = useAnimatedStyle(() => ({
      backgroundColor: animatedColors.value.backdrop,
      opacity:
        Math.min(1, Math.max(0, 1 - translateY.value / windowHeight)) *
        BOTTOM_SHEET.backdropOpacity,
    }));
    const sheetStyle = useAnimatedStyle(() => {
      const keyboardHeight = keyboardOffset?.value ?? 0;

      return {
        maxHeight: Math.max(
          0,
          windowHeight * BOTTOM_SHEET.maxHeightRatio - keyboardHeight,
        ),
        transform: [{ translateY: translateY.value - keyboardHeight }],
        backgroundColor: animatedColors.value.surface,
        borderColor: isDark
          ? animatedColors.value.border
          : animatedColors.value.surface,
      };
    });
    const sheetContainerStyle = useMemo(
      () => [styles.sheet, isDark ? null : lightCardShadow],
      [isDark],
    );
    const handleStyle = useAnimatedStyle(() => ({
      backgroundColor: animatedColors.value.border,
    }));
    const handleBackdropPress = useCallback(() => {
      if (dismissEnabled) {
        requestDismiss();
      }
    }, [dismissEnabled, requestDismiss]);

    return (
      <View style={styles.root}>
        <Animated.View
          style={[styles.backdrop, backdropStyle]}
          pointerEvents="none"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={dismissLabel}
          accessibilityState={{ disabled: !dismissEnabled }}
          disabled={!dismissEnabled}
          onPress={handleBackdropPress}
          style={styles.backdrop}
        />
        <Animated.View
          style={[sheetContainerStyle, sheetStyle]}
          accessibilityViewIsModal
        >
          <GestureDetector gesture={panGesture}>
            <View
              style={styles.handleArea}
              accessible
              accessibilityLabel={`Drag down to dismiss ${dismissLabel.toLocaleLowerCase()}`}
            >
              <Animated.View style={[styles.handle, handleStyle]} />
            </View>
          </GestureDetector>
          <View style={styles.content}>{children}</View>
        </Animated.View>
      </View>
    );
  },
);
