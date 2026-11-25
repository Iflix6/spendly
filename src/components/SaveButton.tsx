import { SAVE_BUTTON } from "@/constants/expenseForm";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { durations, easing, springs } from "@/theme/motion";
import { useTheme } from "@/theme/ThemeProvider";
import { fontFamily, opacity, radii, typography } from "@/theme/tokens";
import { Canvas, Path, Skia } from "@shopify/react-native-skia";
import { useCallback, useEffect, useMemo } from "react";
import { Pressable, StyleSheet, type LayoutChangeEvent } from "react-native";
import Animated, {
    cancelAnimation,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";

interface SaveButtonProps {
  label: string;
  disabled: boolean;
  saving: boolean;
  onPress: () => void;
  onAnimationComplete: () => void;
}

const styles = StyleSheet.create({
  pressable: {
    width: "100%",
    height: SAVE_BUTTON.height,
  },
  container: {
    height: SAVE_BUTTON.height,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: opacity.muted,
  },
  background: {
    ...StyleSheet.absoluteFill,
    borderRadius: radii.pill,
  },
  label: {
    ...typography.body,
    fontFamily: fontFamily.semibold,
  },
  canvas: {
    width: SAVE_BUTTON.circleSize,
    height: SAVE_BUTTON.circleSize,
  },
});

export function SaveButton({
  label,
  disabled,
  saving,
  onPress,
  onAnimationComplete,
}: SaveButtonProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotionSafe();
  const progress = useSharedValue(0);
  const pressScale = useSharedValue(1);
  const buttonWidth = useSharedValue<number>(SAVE_BUTTON.circleSize);

  useEffect(() => {
    cancelAnimation(progress);

    if (!saving) {
      progress.value = 0;
      return;
    }

    progress.value = withTiming(
      1,
      {
        duration: reduceMotion
          ? durations.reduced
          : SAVE_BUTTON.checkDrawDurationMs,
        easing: easing.standard,
      },
      (finished) => {
        "worklet";
        if (finished) {
          runOnJS(onAnimationComplete)();
        }
      },
    );

    return () => cancelAnimation(progress);
  }, [onAnimationComplete, progress, reduceMotion, saving]);

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      buttonWidth.value = event.nativeEvent.layout.width;
    },
    [buttonWidth],
  );
  const handlePressIn = useCallback(() => {
    pressScale.value = reduceMotion
      ? 1
      : withSpring(SAVE_BUTTON.pressedScale, springs.snappy);
  }, [pressScale, reduceMotion]);
  const handlePressOut = useCallback(() => {
    pressScale.value = reduceMotion ? 1 : withSpring(1, springs.snappy);
  }, [pressScale, reduceMotion]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));
  const backgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: colors.accent,
    transform: [
      {
        scaleX: reduceMotion
          ? 1
          : interpolate(
              progress.value,
              [0, 1],
              [
                1,
                SAVE_BUTTON.circleSize /
                  Math.max(buttonWidth.value, SAVE_BUTTON.circleSize),
              ],
            ),
      },
    ],
  }));
  const labelStyle = useAnimatedStyle(() => ({
    color: colors.onAccent,
    opacity: 1 - progress.value,
  }));
  const checkStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));
  const checkPath = useMemo(
    () =>
      Skia.PathBuilder.Make()
        .moveTo(SAVE_BUTTON.checkStartX, SAVE_BUTTON.checkStartY)
        .lineTo(SAVE_BUTTON.checkMiddleX, SAVE_BUTTON.checkMiddleY)
        .lineTo(SAVE_BUTTON.checkEndX, SAVE_BUTTON.checkEndY)
        .detach(),
    [],
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={saving ? "Saving expense" : label}
      accessibilityState={{ disabled, busy: saving }}
      disabled={disabled || saving}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.pressable}
    >
      <Animated.View
        onLayout={handleLayout}
        style={[styles.container, disabled && styles.disabled, containerStyle]}
      >
        <Animated.View style={[styles.background, backgroundStyle]} />
        <Animated.Text style={[styles.label, labelStyle]} numberOfLines={1}>
          {label}
        </Animated.Text>
        <Animated.View style={[styles.canvas, checkStyle]} pointerEvents="none">
          <Canvas style={styles.canvas}>
            <Path
              path={checkPath}
              start={0}
              end={reduceMotion ? 1 : progress}
              color={colors.onAccent}
              strokeWidth={SAVE_BUTTON.strokeWidth}
              strokeCap="round"
              strokeJoin="round"
            />
          </Canvas>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}
