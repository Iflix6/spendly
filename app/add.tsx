import { BottomSheet, type BottomSheetHandle } from "@/components/BottomSheet";
import { CategoryChip } from "@/components/CategoryChip";
import { DatePill } from "@/components/DatePill";
import { NumberPad } from "@/components/NumberPad";
import { SaveButton } from "@/components/SaveButton";
import { useSnackbar } from "@/components/SnackbarProvider";
import { CURRENCY_SYMBOL, NOTE_MAX } from "@/constants";
import { CATEGORIES, type CategoryId } from "@/constants/categories";
import { AMOUNT_INPUT, DELETE_CONFIRM } from "@/constants/expenseForm";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { toNoonISO } from "@/lib/dates";
import {
    datePreset,
    formatKeypadDisplay,
    keypadValueFromCents,
} from "@/lib/expenseForm";
import { selection, success, warning } from "@/lib/haptics";
import { centsFromKeypad } from "@/lib/money";
import { useExpenseStore } from "@/store/useExpenseStore";
import { easing, springs } from "@/theme/motion";
import { useTheme } from "@/theme/ThemeProvider";
import {
    fontFamily,
    layout,
    opacity,
    radii,
    spacing,
    tabularNums,
    typography,
} from "@/theme/tokens";
import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker, {
    type DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Keyboard,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import Animated, {
    cancelAnimation,
    useAnimatedKeyboard,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.base,
    gap: spacing.lg,
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
  close: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.input,
    borderWidth: layout.borderWidth,
  },
  amountArea: {
    minHeight: typography.display.lineHeight + spacing.xl,
    justifyContent: "center",
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
  },
  currency: {
    ...typography.display,
    ...tabularNums,
    marginRight: spacing.xs,
  },
  amount: {
    ...typography.display,
    ...tabularNums,
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    ...typography.caption,
  },
  chipsScroll: {
    flexGrow: 0,
  },
  chipsContent: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingRight: spacing.xl,
  },
  noteHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.base,
  },
  noteCounter: {
    ...typography.caption,
    ...tabularNums,
  },
  noteInput: {
    ...typography.body,
    minHeight: layout.minTouchTarget,
    borderRadius: radii.input,
    borderWidth: layout.borderWidth,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  save: {
    marginTop: spacing.xs,
  },
  delete: {
    minHeight: layout.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteLabel: {
    ...typography.body,
    fontFamily: fontFamily.medium,
  },
  picker: {
    borderRadius: radii.card,
    overflow: "hidden",
  },
});

export default function AddExpenseScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editId = typeof id === "string" && id.length > 0 ? id : undefined;
  const expenses = useExpenseStore((state) => state.expenses);
  const addExpense = useExpenseStore((state) => state.addExpense);
  const updateExpense = useExpenseStore((state) => state.updateExpense);
  const deleteExpense = useExpenseStore((state) => state.deleteExpense);
  const undoDelete = useExpenseStore((state) => state.undoDelete);
  const { showSnackbar } = useSnackbar();
  const reduceMotion = useReducedMotionSafe();
  const insets = useSafeAreaInsets();
  const keyboard = useAnimatedKeyboard();
  const sheetRef = useRef<BottomSheetHandle>(null);
  const deleteConfirmTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const showDeleteSnackbar = useRef(false);
  const expense = editId
    ? expenses.find((candidate) => candidate.id === editId)
    : undefined;
  const isEditing = editId !== undefined;
  const isMissingEdit = isEditing && expense === undefined;
  const today = useMemo(() => new Date(), []);
  const [amount, setAmount] = useState(() =>
    expense ? keypadValueFromCents(expense.amountCents) : "",
  );
  const [categoryId, setCategoryId] = useState<CategoryId>(
    () => expense?.categoryId ?? "food",
  );
  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    expense ? new Date(expense.date) : new Date(),
  );
  const [note, setNote] = useState(() => expense?.note ?? "");
  const [pickerVisible, setPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteArmed, setDeleteArmed] = useState(false);
  const amountScale = useSharedValue(1);
  const amountShake = useSharedValue(0);

  const clearDeleteTimeout = useCallback(() => {
    if (deleteConfirmTimeout.current !== null) {
      clearTimeout(deleteConfirmTimeout.current);
      deleteConfirmTimeout.current = null;
    }
  }, []);

  useEffect(() => {
    return clearDeleteTimeout;
  }, [clearDeleteTimeout]);

  useEffect(() => {
    if (isMissingEdit) {
      sheetRef.current?.dismiss();
    }
  }, [isMissingEdit]);

  const handleDismiss = useCallback(() => {
    if (showDeleteSnackbar.current) {
      showDeleteSnackbar.current = false;
      showSnackbar({
        message: "Expense deleted",
        actionLabel: "Undo",
        onAction: undoDelete,
      });
    }

    router.back();
  }, [router, showSnackbar, undoDelete]);

  const animateAmountPop = useCallback(() => {
    cancelAnimation(amountScale);
    cancelAnimation(amountShake);

    if (reduceMotion) {
      amountScale.value = 1;
      amountShake.value = 0;
      return;
    }

    amountScale.value = withSequence(
      withSpring(AMOUNT_INPUT.popScale, springs.bouncy),
      withSpring(1, springs.bouncy),
    );
  }, [amountScale, amountShake, reduceMotion]);

  const handleAmountChange = useCallback(
    (nextAmount: string) => {
      setAmount(nextAmount);
      animateAmountPop();
    },
    [animateAmountPop],
  );

  const handleInvalidAmount = useCallback(() => {
    void warning();
    cancelAnimation(amountScale);
    cancelAnimation(amountShake);
    amountScale.value = 1;

    if (reduceMotion) {
      amountShake.value = 0;
      return;
    }

    const stepDuration =
      AMOUNT_INPUT.shakeDurationMs / (AMOUNT_INPUT.shakeOscillations * 2);
    const steps = Array.from(
      { length: AMOUNT_INPUT.shakeOscillations * 2 },
      (_, index) =>
        withTiming(
          index % 2 === 0
            ? AMOUNT_INPUT.shakeDistance
            : -AMOUNT_INPUT.shakeDistance,
          { duration: stepDuration, easing: easing.standard },
        ),
    );

    amountShake.value = withSequence(
      ...steps,
      withTiming(0, { duration: 0, easing: easing.standard }),
    );
  }, [amountScale, amountShake, reduceMotion]);

  const handleCategoryPress = useCallback((nextCategory: CategoryId) => {
    void selection();
    setCategoryId(nextCategory);
  }, []);

  const handleTodayPress = useCallback(() => {
    void selection();
    setSelectedDate(new Date());
  }, []);

  const handleYesterdayPress = useCallback(() => {
    void selection();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setSelectedDate(yesterday);
  }, []);

  const handlePickDatePress = useCallback(() => {
    void selection();
    setPickerVisible(true);
  }, []);

  const handleDateChange = useCallback(
    (_event: DateTimePickerChangeEvent, date: Date) => {
      setSelectedDate(date);
      setPickerVisible(false);
    },
    [],
  );

  const handleDateDismiss = useCallback(() => {
    setPickerVisible(false);
  }, []);

  const handleSave = useCallback(() => {
    const amountCents = centsFromKeypad(amount);
    if (saving || amountCents <= 0 || isMissingEdit) {
      return;
    }

    const input = {
      amountCents,
      categoryId,
      date: toNoonISO(selectedDate),
      note: note.trim(),
    };

    void success();
    setSaving(true);

    if (editId) {
      updateExpense(editId, input);
    } else {
      addExpense(input);
    }
  }, [
    addExpense,
    amount,
    categoryId,
    editId,
    isMissingEdit,
    note,
    saving,
    selectedDate,
    updateExpense,
  ]);

  const handleSaveAnimationComplete = useCallback(() => {
    sheetRef.current?.dismiss();
  }, []);

  const handleDeletePress = useCallback(() => {
    if (!editId || saving) {
      return;
    }

    if (!deleteArmed) {
      setDeleteArmed(true);
      clearDeleteTimeout();
      deleteConfirmTimeout.current = setTimeout(() => {
        setDeleteArmed(false);
        deleteConfirmTimeout.current = null;
      }, DELETE_CONFIRM.timeoutMs);
      return;
    }

    clearDeleteTimeout();
    setDeleteArmed(false);
    void warning();
    deleteExpense(editId);
    showDeleteSnackbar.current = true;
    sheetRef.current?.dismiss();
  }, [clearDeleteTimeout, deleteArmed, deleteExpense, editId, saving]);

  const amountShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: amountShake.value }],
  }));
  const amountScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: amountScale.value }],
  }));
  const titleStyle = useMemo(
    () => [styles.title, { color: colors.text }],
    [colors.text],
  );
  const closeStyle = useMemo(
    () => [
      styles.close,
      {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        opacity: saving ? opacity.muted : 1,
      },
    ],
    [colors.border, colors.surface, saving],
  );
  const currencyStyle = useMemo(
    () => [styles.currency, { color: colors.textMuted }],
    [colors.textMuted],
  );
  const amountStyle = useMemo(
    () => [styles.amount, { color: colors.text }],
    [colors.text],
  );
  const sectionLabelStyle = useMemo(
    () => [styles.sectionLabel, { color: colors.textMuted }],
    [colors.textMuted],
  );
  const noteInputStyle = useMemo(
    () => [
      styles.noteInput,
      {
        backgroundColor: colors.surfaceAlt,
        borderColor: colors.border,
        color: colors.text,
        selectionColor: colors.accent,
      },
    ],
    [colors.accent, colors.border, colors.surfaceAlt, colors.text],
  );
  const deleteLabelStyle = useMemo(
    () => [styles.deleteLabel, { color: colors.danger }],
    [colors.danger],
  );
  const contentStyle = useMemo(
    () => [
      styles.content,
      { paddingBottom: Math.max(insets.bottom, spacing.base) },
    ],
    [insets.bottom],
  );
  const selectedPreset = datePreset(selectedDate, today);
  const amountCents = centsFromKeypad(amount);
  const deleteLabel = deleteArmed ? "Tap again to confirm" : "Delete";

  return (
    <BottomSheet
      ref={sheetRef}
      onDismiss={handleDismiss}
      keyboardOffset={keyboard.height}
      dismissEnabled={!saving}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={contentStyle}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.header}>
          <Text style={titleStyle}>
            {isEditing ? "Edit expense" : "New expense"}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close expense sheet"
            accessibilityState={{ disabled: saving }}
            disabled={saving}
            onPress={() => sheetRef.current?.dismiss()}
            style={({ pressed }) => [
              closeStyle,
              pressed && !saving
                ? { backgroundColor: colors.surfaceAlt }
                : null,
            ]}
          >
            <Ionicons name="close" size={spacing.xl} color={colors.text} />
          </Pressable>
        </View>

        <Animated.View
          style={[styles.amountArea, amountShakeStyle]}
          accessibilityLabel={`Expense amount ${formatKeypadDisplay(amount || "0")} dollars`}
        >
          <View style={styles.amountRow}>
            <Text style={currencyStyle}>{CURRENCY_SYMBOL}</Text>
            <Animated.Text
              testID="amount-display"
              style={[amountStyle, amountScaleStyle]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={AMOUNT_INPUT.minimumFontScale}
            >
              {formatKeypadDisplay(amount || "0")}
            </Animated.Text>
          </View>
        </Animated.View>

        <View style={styles.section}>
          <Text style={sectionLabelStyle}>Category</Text>
          <ScrollView
            horizontal
            style={styles.chipsScroll}
            contentContainerStyle={styles.chipsContent}
            showsHorizontalScrollIndicator={false}
          >
            {CATEGORIES.map((category) => (
              <CategoryChip
                key={category.id}
                category={category}
                label={category.label}
                selected={categoryId === category.id}
                onPress={() => handleCategoryPress(category.id)}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={sectionLabelStyle}>Date</Text>
          <ScrollView
            horizontal
            style={styles.chipsScroll}
            contentContainerStyle={styles.chipsContent}
            showsHorizontalScrollIndicator={false}
          >
            <DatePill
              label="Today"
              selected={selectedPreset === "today"}
              onPress={handleTodayPress}
            />
            <DatePill
              label="Yesterday"
              selected={selectedPreset === "yesterday"}
              onPress={handleYesterdayPress}
            />
            <DatePill
              label="Pick date"
              selected={selectedPreset === "custom"}
              onPress={handlePickDatePress}
            />
          </ScrollView>
          {pickerVisible ? (
            <DateTimePicker
              testID="expense-date-picker"
              style={styles.picker}
              value={selectedDate}
              mode="date"
              maximumDate={today}
              display={Platform.OS === "ios" ? "inline" : "default"}
              accentColor={colors.accent}
              textColor={colors.text}
              themeVariant={isDark ? "dark" : "light"}
              onValueChange={handleDateChange}
              onDismiss={handleDateDismiss}
            />
          ) : null}
        </View>

        <View style={styles.section}>
          <View style={styles.noteHeader}>
            <Text style={sectionLabelStyle}>Note</Text>
            <Text style={[styles.noteCounter, { color: colors.textMuted }]}>
              {note.length}/{NOTE_MAX}
            </Text>
          </View>
          <TextInput
            accessibilityLabel="Note"
            value={note}
            onChangeText={setNote}
            placeholder="Add a note (optional)"
            placeholderTextColor={colors.textMuted}
            maxLength={NOTE_MAX}
            style={noteInputStyle}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />
        </View>

        <NumberPad
          value={amount}
          onChange={handleAmountChange}
          onInvalid={handleInvalidAmount}
        />

        <View style={styles.save}>
          <SaveButton
            label="Save expense"
            disabled={amountCents <= 0}
            saving={saving}
            onPress={handleSave}
            onAnimationComplete={handleSaveAnimationComplete}
          />
        </View>

        {isEditing ? (
          <Pressable
            testID="delete-expense"
            accessibilityRole="button"
            accessibilityLabel={deleteLabel}
            onPress={handleDeletePress}
            style={styles.delete}
          >
            <Text style={deleteLabelStyle}>{deleteLabel}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </BottomSheet>
  );
}
