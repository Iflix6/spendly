import { SEARCH_BAR } from "@/constants/expenses";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { durations, easing } from "@/theme/motion";
import { useTheme } from "@/theme/ThemeProvider";
import { layout, radii, spacing, typography } from "@/theme/tokens";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useMemo } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

interface SearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
  onClear: () => void;
}

const styles = StyleSheet.create({
  shell: {
    height: SEARCH_BAR.height,
    minHeight: layout.minTouchTarget,
    borderRadius: radii.input,
    borderWidth: layout.borderWidth,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: spacing.base,
    paddingRight: spacing.xs,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  input: {
    ...typography.body,
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
  },
  clearTarget: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  clearContent: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export function SearchBar({ value, onChangeText, onClear }: SearchBarProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotionSafe();
  const clearProgress = useSharedValue(value.length > 0 ? 1 : 0);
  const hasText = value.length > 0;

  useEffect(() => {
    clearProgress.value = reduceMotion
      ? hasText
        ? 1
        : 0
      : withTiming(hasText ? 1 : 0, {
          duration: durations.fast,
          easing: easing.standard,
        });
  }, [clearProgress, hasText, reduceMotion]);

  const shellStyle = useMemo(
    () => [
      styles.shell,
      {
        backgroundColor: colors.surfaceAlt,
        borderColor: colors.surfaceAlt,
      },
    ],
    [colors.surfaceAlt],
  );
  const inputStyle = useMemo(
    () => [styles.input, { color: colors.text }],
    [colors.text],
  );
  const clearStyle = useAnimatedStyle(() => ({
    opacity: clearProgress.value,
    transform: [{ scale: clearProgress.value }],
  }));

  return (
    <View style={shellStyle}>
      <Ionicons
        name="search-outline"
        size={SEARCH_BAR.iconSize}
        color={colors.mutedText}
        style={styles.searchIcon}
      />
      <TextInput
        accessibilityRole="search"
        accessibilityLabel="Search expenses"
        value={value}
        onChangeText={onChangeText}
        placeholder="Search expenses"
        placeholderTextColor={colors.mutedText}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        style={inputStyle}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Clear search"
        accessibilityState={{ disabled: !hasText }}
        disabled={!hasText}
        onPress={onClear}
        style={styles.clearTarget}
      >
        <Animated.View style={[styles.clearContent, clearStyle]}>
          <Ionicons
            name="close-circle"
            size={SEARCH_BAR.iconSize}
            color={colors.mutedText}
          />
        </Animated.View>
      </Pressable>
    </View>
  );
}
