import { CategoryIcon } from "@/components/CategoryIcon";
import { useSnackbar } from "@/components/SnackbarProvider";
import { CATEGORY_BY_ID } from "@/constants/categories";
import { EXPENSE_DETAIL } from "@/constants/expenses";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import {
  measureExpenseElement,
  takeExpenseTransition,
  type ExpenseElementRect,
  type ExpenseTransitionOrigin,
} from "@/lib/expenseTransition";
import { lightImpact, warning } from "@/lib/haptics";
import { formatMoney, formatMoneySpoken } from "@/lib/money";
import { useExpenseStore } from "@/store/useExpenseStore";
import { springs } from "@/theme/motion";
import { useAnimatedThemeColors, useTheme } from "@/theme/ThemeProvider";
import {
  fontFamily,
  layout,
  lightCardShadow,
  radii,
  spacing,
  tabularNums,
  typography,
} from "@/theme/tokens";
import Ionicons from "@expo/vector-icons/Ionicons";
import { format } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
} from "react";
import {
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base,
  },
  title: {
    ...typography.title,
    flex: 1,
  },
  back: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    borderRadius: radii.input,
    borderWidth: layout.borderWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    borderRadius: radii.card,
    borderWidth: layout.borderWidth,
    padding: EXPENSE_DETAIL.cardPadding,
    gap: spacing.xl,
  },
  hero: {
    minHeight: EXPENSE_DETAIL.heroMinHeight,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  heroIcon: {
    alignItems: "center",
    justifyContent: "center",
  },
  heroAmount: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  category: {
    ...typography.headline,
    fontFamily: fontFamily.semibold,
    textAlign: "center",
  },
  amount: {
    ...typography.display,
    ...tabularNums,
    width: "100%",
    textAlign: "center",
  },
  details: {
    gap: spacing.md,
  },
  detailRow: {
    gap: spacing.xs,
  },
  detailLabel: {
    ...typography.caption,
    fontFamily: fontFamily.semibold,
  },
  detailValue: {
    ...typography.body,
  },
  noNote: {
    ...typography.body,
    fontStyle: "italic",
  },
  created: {
    ...typography.caption,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  action: {
    flex: 1,
    minHeight: layout.minTouchTarget,
    borderRadius: radii.input,
    borderWidth: layout.borderWidth,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  actionLabel: {
    ...typography.body,
    fontFamily: fontFamily.semibold,
    textAlign: "center",
  },
});

function getElementMotion(
  source: ExpenseElementRect | null,
  target: ExpenseElementRect | null,
  progress: number,
) {
  "worklet";

  if (!source) {
    return { translateX: 0, translateY: 0, scale: 1, opacity: 1 };
  }
  if (!target || target.width <= 0 || target.height <= 0) {
    return { translateX: 0, translateY: 0, scale: 1, opacity: 0 };
  }

  const remaining = 1 - progress;
  const targetCenterX = target.x + target.width / 2;
  const targetCenterY = target.y + target.height / 2;
  const sourceCenterX = source.x + source.width / 2;
  const sourceCenterY = source.y + source.height / 2;
  const scale = Math.sqrt(
    (source.width / target.width) * (source.height / target.height),
  );

  return {
    translateX: (sourceCenterX - targetCenterX) * remaining,
    translateY: (sourceCenterY - targetCenterY) * remaining,
    scale: 1 + (scale - 1) * remaining,
    opacity: progress,
  };
}

function animateElement(
  progress: SharedValue<number>,
  source: ExpenseElementRect | null,
  target: SharedValue<ExpenseElementRect | null>,
) {
  "worklet";

  const motion = getElementMotion(source, target.value, progress.value);
  return {
    opacity: motion.opacity,
    transform: [
      { translateX: motion.translateX },
      { translateY: motion.translateY },
      { scale: motion.scale },
    ],
  };
}

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const expenseId = typeof id === "string" ? id : undefined;
  const expense = useExpenseStore((state) =>
    expenseId
      ? state.expenses.find((candidate) => candidate.id === expenseId)
      : undefined,
  );
  const deleteExpense = useExpenseStore((state) => state.deleteExpense);
  const undoDelete = useExpenseStore((state) => state.undoDelete);
  const { colors, isDark } = useTheme();
  const animatedColors = useAnimatedThemeColors();
  const { showSnackbar } = useSnackbar();
  const router = useRouter();
  const reduceMotion = useReducedMotionSafe();
  const { width: windowWidth } = useWindowDimensions();
  const [transitionOrigin] = useState<ExpenseTransitionOrigin | null>(() =>
    expenseId ? takeExpenseTransition(expenseId) : null,
  );
  const iconRef = useRef<ComponentRef<typeof View> | null>(null);
  const amountRef = useRef<ComponentRef<typeof View> | null>(null);
  const iconTarget = useSharedValue<ExpenseElementRect | null>(null);
  const amountTarget = useSharedValue<ExpenseElementRect | null>(null);
  const progress = useSharedValue(reduceMotion || !transitionOrigin ? 1 : 0);
  const gestureStartX = useSharedValue(0);
  const gestureStartProgress = useSharedValue(1);
  const gestureAllowed = useSharedValue(true);
  const leaving = useRef(false);
  const category = expense ? CATEGORY_BY_ID[expense.categoryId] : undefined;
  const amount = expense ? formatMoney(expense.amountCents) : "";
  const fullDate = useMemo(
    () => (expense ? format(new Date(expense.date), "EEEE, d MMMM yyyy") : ""),
    [expense],
  );
  const createdAt = useMemo(
    () =>
      expense
        ? format(new Date(expense.createdAt), "MMM d, yyyy 'at' h:mm a")
        : "",
    [expense],
  );

  const navigateBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/expenses");
    }
  }, [router]);

  const dismiss = useCallback(() => {
    if (leaving.current) {
      return;
    }

    leaving.current = true;
    if (
      reduceMotion ||
      !transitionOrigin ||
      iconTarget.value === null ||
      amountTarget.value === null
    ) {
      navigateBack();
      return;
    }

    cancelAnimation(progress);
    progress.value = withSpring(0, springs.soft, (finished) => {
      "worklet";
      if (finished) {
        runOnJS(navigateBack)();
      }
    });
  }, [
    amountTarget,
    iconTarget,
    navigateBack,
    progress,
    reduceMotion,
    transitionOrigin,
  ]);

  useEffect(() => {
    let cancelled = false;

    if (reduceMotion || !transitionOrigin) {
      progress.value = 1;
      return;
    }

    void Promise.all([
      measureExpenseElement(iconRef.current),
      measureExpenseElement(amountRef.current),
    ]).then(([nextIconTarget, nextAmountTarget]) => {
      if (cancelled) {
        return;
      }

      if (!nextIconTarget || !nextAmountTarget) {
        progress.value = 1;
        return;
      }

      iconTarget.value = nextIconTarget;
      amountTarget.value = nextAmountTarget;
      progress.value = withSpring(1, springs.soft);
    });

    return () => {
      cancelled = true;
      cancelAnimation(progress);
    };
  }, [iconTarget, amountTarget, progress, reduceMotion, transitionOrigin]);

  useEffect(() => {
    if (!expense && !leaving.current) {
      leaving.current = true;
      navigateBack();
    }
  }, [expense, navigateBack]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        dismiss();
        return true;
      },
    );

    return () => subscription.remove();
  }, [dismiss]);

  const backGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([
          -Number.MAX_SAFE_INTEGER,
          EXPENSE_DETAIL.edgeSwipeActivation,
        ])
        .failOffsetY([
          -EXPENSE_DETAIL.verticalFailOffset,
          EXPENSE_DETAIL.verticalFailOffset,
        ])
        .onStart((event) => {
          "worklet";
          gestureAllowed.value = event.x <= EXPENSE_DETAIL.edgeSwipeZone;
          if (!gestureAllowed.value) {
            return;
          }

          cancelAnimation(progress);
          gestureStartX.value = event.translationX;
          gestureStartProgress.value = progress.value;
        })
        .onUpdate((event) => {
          "worklet";
          if (!gestureAllowed.value || reduceMotion) {
            return;
          }

          const distance = event.translationX - gestureStartX.value;
          progress.value = Math.max(
            0,
            Math.min(
              1,
              gestureStartProgress.value - distance / Math.max(1, windowWidth),
            ),
          );
        })
        .onEnd((event, success) => {
          "worklet";
          if (!gestureAllowed.value) {
            return;
          }

          const shouldDismiss =
            success &&
            (event.translationX - gestureStartX.value >=
              EXPENSE_DETAIL.backDismissDistance ||
              event.velocityX >= EXPENSE_DETAIL.backDismissVelocity);

          if (shouldDismiss) {
            runOnJS(dismiss)();
            return;
          }

          progress.value = reduceMotion ? 1 : withSpring(1, springs.soft);
        }),
    [
      dismiss,
      gestureAllowed,
      gestureStartProgress,
      gestureStartX,
      navigateBack,
      progress,
      reduceMotion,
      windowWidth,
    ],
  );

  const handleEdit = useCallback(() => {
    if (!expenseId) {
      return;
    }

    void lightImpact();
    router.push(`/add?id=${encodeURIComponent(expenseId)}`);
  }, [expenseId, router]);

  const handleDelete = useCallback(() => {
    if (!expenseId || leaving.current) {
      return;
    }

    void warning();
    dismiss();
    deleteExpense(expenseId);
    showSnackbar({
      message: "Expense deleted",
      actionLabel: "Undo",
      onAction: undoDelete,
    });
  }, [deleteExpense, dismiss, expenseId, showSnackbar, undoDelete]);

  const rootStyle = useAnimatedStyle(() => ({
    backgroundColor: animatedColors.value.bg,
  }));
  const backStyle = useAnimatedStyle(() => ({
    backgroundColor: animatedColors.value.surface,
    borderColor: animatedColors.value.border,
  }));
  const cardStyle = useAnimatedStyle(() => ({
    backgroundColor: animatedColors.value.surface,
    borderColor: animatedColors.value.border,
  }));
  const editStyle = useAnimatedStyle(() => ({
    backgroundColor: animatedColors.value.surfaceAlt,
    borderColor: animatedColors.value.border,
  }));
  const deleteStyle = useAnimatedStyle(() => ({
    backgroundColor: animatedColors.value.surface,
    borderColor: animatedColors.value.danger,
  }));
  const iconStyle = useAnimatedStyle(() =>
    animateElement(progress, transitionOrigin?.icon ?? null, iconTarget),
  );
  const amountStyle = useAnimatedStyle(() =>
    animateElement(progress, transitionOrigin?.amount ?? null, amountTarget),
  );
  const detailsStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));
  const titleStyle = useMemo(
    () => [styles.title, { color: colors.text }],
    [colors.text],
  );
  const categoryStyle = useMemo(
    () => [styles.category, { color: colors.text }],
    [colors.text],
  );
  const amountTextStyle = useMemo(
    () => [styles.amount, { color: colors.text }],
    [colors.text],
  );
  const detailLabelStyle = useMemo(
    () => [styles.detailLabel, { color: colors.textMuted }],
    [colors.textMuted],
  );
  const detailValueStyle = useMemo(
    () => [styles.detailValue, { color: colors.text }],
    [colors.text],
  );
  const noNoteStyle = useMemo(
    () => [styles.noNote, { color: colors.textMuted }],
    [colors.textMuted],
  );
  const createdStyle = useMemo(
    () => [styles.created, { color: colors.textMuted }],
    [colors.textMuted],
  );
  const editLabelStyle = useMemo(
    () => [styles.actionLabel, { color: colors.accent }],
    [colors.accent],
  );
  const deleteLabelStyle = useMemo(
    () => [styles.actionLabel, { color: colors.danger }],
    [colors.danger],
  );

  return (
    <GestureDetector gesture={backGesture}>
      <Animated.View style={[{ flex: 1 }, rootStyle]}>
        <SafeAreaView
          style={styles.safeArea}
          edges={["top", "left", "right", "bottom"]}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back to expenses"
                accessibilityHint="Returns to the previous screen"
                onPress={dismiss}
                style={styles.back}
              >
                <Animated.View style={[StyleSheet.absoluteFill, backStyle]} />
                <Ionicons
                  name="arrow-back"
                  size={spacing.xl}
                  color={colors.text}
                />
              </Pressable>
              <Text accessibilityRole="header" style={titleStyle}>
                Expense details
              </Text>
            </View>

            {expense && category ? (
              <>
                <Animated.View
                  style={[
                    styles.card,
                    cardStyle,
                    isDark ? null : lightCardShadow,
                  ]}
                >
                  <View style={styles.hero}>
                    <View ref={iconRef} style={styles.heroIcon}>
                      <Animated.View style={iconStyle}>
                        <CategoryIcon
                          categoryId={expense.categoryId}
                          size={EXPENSE_DETAIL.iconSize}
                        />
                      </Animated.View>
                    </View>
                    <View ref={amountRef} style={styles.heroAmount}>
                      <Animated.Text
                        accessible
                        accessibilityLabel={formatMoneySpoken(
                          expense.amountCents,
                        )}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={EXPENSE_DETAIL.amountMinimumFontScale}
                        style={[amountTextStyle, amountStyle]}
                      >
                        {amount}
                      </Animated.Text>
                    </View>
                    <Text style={categoryStyle}>{category.label}</Text>
                  </View>

                  <Animated.View style={[styles.details, detailsStyle]}>
                    <View style={styles.detailRow}>
                      <Text style={detailLabelStyle}>Date</Text>
                      <Text style={detailValueStyle}>{fullDate}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={detailLabelStyle}>Note</Text>
                      <Text
                        style={
                          expense.note.trim() ? detailValueStyle : noNoteStyle
                        }
                      >
                        {expense.note.trim() || "No note"}
                      </Text>
                    </View>
                    <Text style={createdStyle}>Created {createdAt}</Text>
                  </Animated.View>
                </Animated.View>

                <Animated.View style={[styles.actions, detailsStyle]}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Edit expense"
                    accessibilityHint="Opens the expense editor"
                    onPress={handleEdit}
                    style={styles.action}
                  >
                    <Animated.View
                      style={[StyleSheet.absoluteFill, editStyle]}
                    />
                    <Text style={editLabelStyle}>Edit</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Delete expense"
                    accessibilityHint="Deletes this expense and offers Undo"
                    onPress={handleDelete}
                    style={styles.action}
                  >
                    <Animated.View
                      style={[StyleSheet.absoluteFill, deleteStyle]}
                    />
                    <Text style={deleteLabelStyle}>Delete</Text>
                  </Pressable>
                </Animated.View>
              </>
            ) : null}
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </GestureDetector>
  );
}
