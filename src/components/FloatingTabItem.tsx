import { TAB_BAR, type TabIconName } from "@/constants/navigation";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { springs } from "@/theme/motion";
import { useTheme } from "@/theme/ThemeProvider";
import { layout, radii, spacing, typography } from "@/theme/tokens";
import Ionicons from "@expo/vector-icons/Ionicons";
import { memo, useCallback, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface FloatingTabItemProps {
  focused: boolean;
  icon: TabIconName;
  label: string;
  routeKey: string;
  onPress: (routeKey: string) => void;
}

const styles = StyleSheet.create({
  item: {
    flex: 1,
    height: TAB_BAR.itemHeight,
    minHeight: layout.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  focused: {
    marginHorizontal: spacing.xs,
    borderRadius: radii.input,
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

export const FloatingTabItem = memo(function FloatingTabItem({
  focused,
  icon,
  label,
  routeKey,
  onPress,
}: FloatingTabItemProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotionSafe();
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = reduceMotion
      ? 1
      : withSpring(TAB_BAR.pressedScale, springs.snappy);
  }, [reduceMotion, scale]);
  const handlePressOut = useCallback(() => {
    scale.value = reduceMotion ? 1 : withSpring(1, springs.snappy);
  }, [reduceMotion, scale]);
  const handlePress = useCallback(() => {
    onPress(routeKey);
  }, [onPress, routeKey]);
  const itemStyle = useMemo(
    () => [
      styles.item,
      focused && styles.focused,
      focused && { backgroundColor: colors.surfaceAlt },
    ],
    [colors.surfaceAlt, focused],
  );
  const labelStyle = useMemo(
    () => [
      styles.label,
      { color: focused ? colors.accentText : colors.mutedText },
    ],
    [colors.accentText, colors.mutedText, focused],
  );
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: focused }}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={itemStyle}
    >
      <Animated.View style={scaleStyle} pointerEvents="none">
        <Ionicons
          name={icon}
          size={TAB_BAR.iconSize}
          color={focused ? colors.accent : colors.mutedText}
        />
      </Animated.View>
      <View style={styles.labelContainer} pointerEvents="none">
        <Text numberOfLines={1} style={labelStyle}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
});
