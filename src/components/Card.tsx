import {
    useAnimatedThemeColors,
    useTheme,
} from "@/theme/ThemeProvider";
import { layout, lightCardShadow, radii } from "@/theme/tokens";
import { useMemo, type ReactNode } from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.card,
    borderWidth: layout.borderWidth,
  },
});

export function Card({ children, style }: CardProps) {
  const { isDark } = useTheme();
  const animatedColors = useAnimatedThemeColors();
  const cardStyle = useMemo(
    () => [styles.card, isDark ? null : lightCardShadow],
    [isDark],
  );
  const surfaceStyle = useAnimatedStyle(() => ({
    backgroundColor: animatedColors.value.surface,
    borderColor: isDark
      ? animatedColors.value.border
      : animatedColors.value.surface,
  }));

  return (
    <Animated.View style={[cardStyle, surfaceStyle, style]}>
      {children}
    </Animated.View>
  );
}
