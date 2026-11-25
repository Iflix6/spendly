import { NUMBER_PAD } from "@/constants/expenseForm";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { selection } from "@/lib/haptics";
import { isRejectedKeypadInput, parseKeypadInput } from "@/lib/money";
import { springs } from "@/theme/motion";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing, typography } from "@/theme/tokens";
import Ionicons from "@expo/vector-icons/Ionicons";
import { memo, useCallback, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";

interface NumberPadProps {
  value: string;
  onChange: (value: string) => void;
  onInvalid: () => void;
}

type NumberPadKeyValue =
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "."
  | "0"
  | "backspace"
  | "clear";

const KEY_ROWS: readonly (readonly NumberPadKeyValue[])[] = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "backspace"],
];

const styles = StyleSheet.create({
  grid: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  key: {
    flex: 1,
    minHeight: NUMBER_PAD.minKeyHeight,
    alignItems: "center",
    justifyContent: "center",
  },
  keyVisual: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.input,
  },
  label: typography.title,
});

interface NumberPadKeyProps {
  value: NumberPadKeyValue;
  onPress: (value: NumberPadKeyValue) => void;
}

const NumberPadKey = memo(function NumberPadKey({
  value,
  onPress,
}: NumberPadKeyProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotionSafe();
  const scale = useSharedValue(1);
  const longPressTriggered = useRef(false);
  const isBackspace = value === "backspace";
  const label = isBackspace
    ? "Backspace"
    : value === "."
      ? "Decimal point"
      : `Digit ${value}`;

  const keyStyle = useAnimatedStyle(() => ({
    backgroundColor: colors.surfaceAlt,
    transform: [{ scale: scale.value }],
  }));
  const handlePressIn = useCallback(() => {
    longPressTriggered.current = false;
    scale.value = reduceMotion
      ? 1
      : withSpring(NUMBER_PAD.pressedScale, springs.snappy);
  }, [reduceMotion, scale]);
  const handlePressOut = useCallback(() => {
    scale.value = reduceMotion ? 1 : withSpring(1, springs.snappy);
  }, [reduceMotion, scale]);
  const handlePress = useCallback(() => {
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }

    void selection();
    onPress(value);
  }, [onPress, value]);
  const handleLongPress = useCallback(() => {
    longPressTriggered.current = true;
    void selection();
    onPress("clear");
  }, [onPress]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={
        isBackspace ? "Long press to clear the amount" : undefined
      }
      delayLongPress={NUMBER_PAD.longPressDelayMs}
      onLongPress={isBackspace ? handleLongPress : undefined}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={styles.key}
      testID={`keypad-${value}`}
    >
      <Animated.View style={[styles.keyVisual, keyStyle]}>
        {isBackspace ? (
          <Ionicons
            name="backspace-outline"
            size={spacing.xl}
            color={colors.text}
          />
        ) : (
          <Text style={[styles.label, { color: colors.text }]}>{value}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
});

export function NumberPad({ value, onChange, onInvalid }: NumberPadProps) {
  const handleKeyPress = useCallback(
    (key: NumberPadKeyValue) => {
      if (isRejectedKeypadInput(value, key)) {
        onInvalid();
        return;
      }

      onChange(parseKeypadInput(value, key));
    },
    [onChange, onInvalid, value],
  );

  return (
    <View style={styles.grid}>
      {KEY_ROWS.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((key) => (
            <NumberPadKey key={key} value={key} onPress={handleKeyPress} />
          ))}
        </View>
      ))}
    </View>
  );
}
