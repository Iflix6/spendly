import { TAB_BAR, TAB_MOTION, type TabIconName } from "@/constants/navigation";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { durations, easing, springs } from "@/theme/motion";
import { useTheme } from "@/theme/ThemeProvider";
import { layout, spacing, typography } from "@/theme/tokens";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";

interface FloatingTabItemProps {
  focused: boolean;
  icon: TabIconName;
  label: string;
  onPress: () => void;
}

const styles = StyleSheet.create({
  item: {
    flex: 1,
    height: TAB_BAR.itemHeight,
    minHeight: layout.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    width: TAB_BAR.iconSize,
    height: TAB_BAR.iconSize,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    position: "absolute",
  },
  label: {
    ...typography.caption,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  labelContainer: {
    width: "100%",
    paddingHorizontal: spacing.xs,
  },
});

export function FloatingTabItem({
  focused,
  icon,
  label,
  onPress,
}: FloatingTabItemProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotionSafe();
  const colorProgress = useSharedValue(focused ? 1 : 0);
  const scale = useSharedValue(1);
  const wasFocused = useRef(focused);

  useEffect(() => {
    const becameFocused = focused && !wasFocused.current;

    colorProgress.value =
      reduceMotion || !becameFocused
        ? focused
          ? 1
          : 0
        : withTiming(1, {
            duration: durations.fast,
            easing: easing.standard,
          });

    if (becameFocused && !reduceMotion) {
      scale.value = withSequence(
        withTiming(TAB_MOTION.iconPeakScale, {
          duration: TAB_MOTION.iconBounceDuration,
          easing: easing.standard,
        }),
        withSpring(1, springs.snappy),
      );
    } else {
      scale.value = reduceMotion ? 1 : withSpring(1, springs.snappy);
    }

    wasFocused.current = focused;
  }, [colorProgress, focused, reduceMotion, scale]);

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const activeIconStyle = useAnimatedStyle(() => ({
    opacity: colorProgress.value,
  }));
  const inactiveIconStyle = useAnimatedStyle(() => ({
    opacity: 1 - colorProgress.value,
  }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: colorProgress.value,
  }));

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: focused }}
      onPress={onPress}
      style={styles.item}
    >
      <Animated.View style={[styles.iconWrap, scaleStyle]} pointerEvents="none">
        <Animated.View
          style={[styles.icon, inactiveIconStyle]}
          pointerEvents="none"
        >
          <Ionicons
            name={icon}
            size={TAB_BAR.iconSize}
            color={colors.textMuted}
          />
        </Animated.View>
        <Animated.View
          style={[styles.icon, activeIconStyle]}
          pointerEvents="none"
        >
          <Ionicons name={icon} size={TAB_BAR.iconSize} color={colors.accent} />
        </Animated.View>
      </Animated.View>
      <Animated.View
        style={[styles.labelContainer, labelStyle]}
        pointerEvents="none"
      >
        <Text
          numberOfLines={1}
          style={[styles.label, { color: colors.accent }]}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
