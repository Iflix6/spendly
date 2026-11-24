import { FAB } from "@/constants/navigation";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { useSheetOpenProgress } from "@/hooks/useSheetOpenProgress";
import { lightImpact } from "@/lib/haptics";
import { springs } from "@/theme/motion";
import { useTheme } from "@/theme/ThemeProvider";
import { fabGlow, opacity, radii } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";

interface FabProps {
  bottomOffset: number;
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    alignSelf: "center",
    width: FAB.size,
    height: FAB.size,
  },
  glow: {
    ...StyleSheet.absoluteFill,
    borderRadius: radii.pill,
    opacity: opacity.fabGlow,
    transform: [{ scale: FAB.glowScale }],
  },
  pressable: {
    width: "100%",
    height: "100%",
    borderRadius: radii.pill,
    ...fabGlow,
  },
  gradient: {
    flex: 1,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});

export function Fab({ bottomOffset }: FabProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const reduceMotion = useReducedMotionSafe();
  const sheetOpenProgress = useSheetOpenProgress();
  const pressScale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    pressScale.value = reduceMotion
      ? 1
      : withSpring(FAB.pressedScale, springs.snappy);
  }, [pressScale, reduceMotion]);

  const handlePressOut = useCallback(() => {
    pressScale.value = reduceMotion ? 1 : withSpring(1, springs.snappy);
  }, [pressScale, reduceMotion]);

  const handlePress = useCallback(() => {
    void lightImpact();
    router.push("/add");
  }, [router]);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));
  const iconStyle = useAnimatedStyle(() => {
    const progress = Math.min(1, Math.max(0, sheetOpenProgress.value));
    return {
      transform: [{ rotate: `${progress * FAB.rotationDegrees}deg` }],
    };
  });

  return (
    <Animated.View
      style={[styles.container, { bottom: bottomOffset }, pressStyle]}
    >
      <View
        style={[styles.glow, { backgroundColor: colors.accent }]}
        pointerEvents="none"
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add expense"
        accessibilityHint="Opens the add expense screen"
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={[styles.pressable, { shadowColor: colors.accent }]}
      >
        <LinearGradient
          colors={[colors.accentAlt, colors.accent]}
          style={styles.gradient}
        >
          <Animated.View style={iconStyle}>
            <Ionicons name="add" size={FAB.iconSize} color={colors.onAccent} />
          </Animated.View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}
