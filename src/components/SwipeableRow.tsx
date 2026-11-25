import { ExpenseRow } from "@/components/ExpenseRow";
import { CATEGORY_BY_ID } from "@/constants/categories";
import { EXPENSE_LIST_MOTION, SWIPE } from "@/constants/expenses";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { lightImpact, warning } from "@/lib/haptics";
import { resistSwipeTranslation, swipeReleaseAction } from "@/lib/swipe";
import type { Expense } from "@/store/useExpenseStore";
import { durations, easing, springs } from "@/theme/motion";
import { useTheme } from "@/theme/ThemeProvider";
import { fontFamily, layout, radii, spacing, typography } from "@/theme/tokens";
import Ionicons from "@expo/vector-icons/Ionicons";
import { memo, useCallback, useEffect, useMemo } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    cancelAnimation,
    FadeIn,
    FadeInDown,
    FadeOut,
    LinearTransition,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    type ExitAnimationsValues,
} from "react-native-reanimated";

interface SwipeableRowProps {
  expense: Expense;
  isOpen: boolean;
  initialRender: boolean;
  entranceIndex: number;
  onOpen: (id: string) => void;
  onClose: (id: string) => void;
  onDelete: (id: string) => void;
  onPress: (expense: Expense) => void;
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  content: {
    flex: 1,
  },
  deleteAction: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: SWIPE.actionWidth,
    alignItems: "center",
    justifyContent: "center",
    borderTopRightRadius: radii.card,
    borderBottomRightRadius: radii.card,
  },
  deleteButton: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteLabel: {
    ...typography.caption,
    fontFamily: fontFamily.semibold,
    marginTop: spacing.xs,
  },
});

const collapseExit = (values: ExitAnimationsValues) => {
  "worklet";
  return {
    initialValues: {
      height: values.currentHeight,
      opacity: 1,
    },
    animations: {
      height: withTiming(0, {
        duration: durations.fast,
        easing: easing.standard,
      }),
      opacity: withTiming(0, {
        duration: durations.fast,
        easing: easing.standard,
      }),
    },
  };
};

export const SwipeableRow = memo(function SwipeableRow({
  expense,
  isOpen,
  initialRender,
  entranceIndex,
  onOpen,
  onClose,
  onDelete,
  onPress,
}: SwipeableRowProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotionSafe();
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);
  const warningTriggered = useSharedValue(false);
  const deleteTriggered = useSharedValue(false);

  const handleOpen = useCallback(() => {
    onOpen(expense.id);
  }, [expense.id, onOpen]);
  const handleClose = useCallback(() => {
    onClose(expense.id);
  }, [expense.id, onClose]);
  const handleDelete = useCallback(() => {
    onDelete(expense.id);
  }, [expense.id, onDelete]);
  const handleWarning = useCallback(() => {
    void warning();
  }, []);
  const handleActionPress = useCallback(() => {
    void lightImpact();
    handleDelete();
  }, [handleDelete]);

  useEffect(() => {
    if (!isOpen) {
      translateX.value = reduceMotion ? 0 : withSpring(0, springs.snappy);
    }
  }, [isOpen, reduceMotion, translateX]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-SWIPE.activationOffset, 0])
        .failOffsetY([-SWIPE.verticalFailOffset, SWIPE.verticalFailOffset])
        .onStart(() => {
          "worklet";
          cancelAnimation(translateX);
          startX.value = translateX.value;
          warningTriggered.value = false;
          deleteTriggered.value = false;
        })
        .onUpdate((event) => {
          "worklet";
          const rawTranslation = Math.min(0, startX.value + event.translationX);
          translateX.value = resistSwipeTranslation(rawTranslation);

          if (
            rawTranslation <= -SWIPE.deleteThreshold &&
            !warningTriggered.value
          ) {
            warningTriggered.value = true;
            runOnJS(handleOpen)();
            runOnJS(handleWarning)();
          }

          if (
            rawTranslation <= -SWIPE.fullDeleteThreshold &&
            !deleteTriggered.value
          ) {
            deleteTriggered.value = true;
            runOnJS(handleDelete)();
          }
        })
        .onEnd((event, success) => {
          "worklet";
          if (deleteTriggered.value) {
            return;
          }

          const rawTranslation = Math.min(0, startX.value + event.translationX);

          if (rawTranslation <= -SWIPE.fullDeleteThreshold) {
            deleteTriggered.value = true;
            runOnJS(handleDelete)();
            return;
          }

          const releaseAction = swipeReleaseAction(rawTranslation);
          const shouldOpen = success && releaseAction === "open";
          translateX.value = reduceMotion
            ? shouldOpen
              ? -SWIPE.actionWidth
              : 0
            : withSpring(shouldOpen ? -SWIPE.actionWidth : 0, springs.snappy);

          if (shouldOpen) {
            runOnJS(handleOpen)();
          } else {
            runOnJS(handleClose)();
          }
        })
        .onFinalize(() => {
          "worklet";
          warningTriggered.value = false;
          deleteTriggered.value = false;
        }),
    [
      handleClose,
      handleDelete,
      handleOpen,
      handleWarning,
      reduceMotion,
      startX,
      translateX,
      deleteTriggered,
      warningTriggered,
    ],
  );

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  const actionStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.abs(translateX.value) / SWIPE.actionWidth),
  }));
  const entering = useMemo(() => {
    if (reduceMotion) {
      return FadeIn.duration(durations.reduced);
    }

    if (
      initialRender &&
      entranceIndex < EXPENSE_LIST_MOTION.initialStaggerCount
    ) {
      return FadeInDown.duration(durations.base)
        .delay(entranceIndex * EXPENSE_LIST_MOTION.staggerStepMs)
        .easing(easing.entrance);
    }

    return FadeIn.duration(durations.fast).easing(easing.entrance);
  }, [entranceIndex, initialRender, reduceMotion]);
  const exiting = reduceMotion
    ? FadeOut.duration(durations.reduced)
    : collapseExit;
  const layoutTransition = useMemo(
    () =>
      reduceMotion
        ? undefined
        : LinearTransition.duration(durations.fast).easing(easing.standard),
    [reduceMotion],
  );
  const actionColorStyle = useMemo(
    () => [styles.deleteAction, { backgroundColor: colors.danger }],
    [colors.danger],
  );
  const deleteLabelStyle = useMemo(
    () => [styles.deleteLabel, { color: colors.onDanger }],
    [colors.onDanger],
  );

  return (
    <Animated.View
      style={styles.container}
      entering={entering}
      exiting={exiting}
      layout={layoutTransition}
    >
      <Animated.View
        style={[actionColorStyle, actionStyle]}
        pointerEvents={isOpen ? "auto" : "none"}
        accessibilityElementsHidden={!isOpen}
        importantForAccessibility={isOpen ? "yes" : "no-hide-descendants"}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete ${CATEGORY_BY_ID[expense.categoryId].label} expense`}
          onPress={handleActionPress}
          style={styles.deleteButton}
        >
          <Ionicons
            name="trash-outline"
            size={SWIPE.iconSize}
            color={colors.onDanger}
          />
          <Text style={deleteLabelStyle}>Delete</Text>
        </Pressable>
      </Animated.View>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.content, contentStyle]}>
          <ExpenseRow
            expense={expense}
            onPress={onPress}
            onAccessibilityDelete={handleDelete}
          />
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
});
