import { ANIMATED_NUMBER } from "@/constants/home";
import { durations, easing, springs } from "@/theme/motion";
import { useEffect, useMemo, useRef } from "react";
import { StyleSheet, Text, View, type TextStyle } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

interface AnimatedDigitProps {
  digit: number;
  digitHeight: number;
  reduceMotion: boolean;
  style: TextStyle;
  maximumFontSizeMultiplier?: number;
}

const DIGITS = Array.from(
  { length: ANIMATED_NUMBER.digitCount },
  (_, index) => String(index),
);

const styles = StyleSheet.create({
  viewport: {
    overflow: "hidden",
  },
  column: {
    flexDirection: "column",
  },
  digit: {
    textAlign: "center",
  },
});

export function AnimatedDigit({
  digit,
  digitHeight,
  reduceMotion,
  style,
  maximumFontSizeMultiplier,
}: AnimatedDigitProps) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const previousTarget = useRef(0);
  const digitStyle = useMemo(
    () => [style, styles.digit, { lineHeight: digitHeight }],
    [digitHeight, style],
  );

  useEffect(() => {
    const target = -digit * digitHeight;
    const changed = target !== previousTarget.current;
    cancelAnimation(translateY);
    cancelAnimation(opacity);

    if (reduceMotion) {
      translateY.value = target;
      if (changed) {
        opacity.value = 0;
        opacity.value = withTiming(1, {
          duration: durations.reduced,
          easing: easing.standard,
        });
      }
    } else if (changed) {
      translateY.value = withSpring(target, springs.snappy);
    }

    previousTarget.current = target;

    return () => {
      cancelAnimation(translateY);
      cancelAnimation(opacity);
    };
  }, [digit, digitHeight, opacity, reduceMotion, translateY]);

  const columnStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View
      style={[styles.viewport, { height: digitHeight }]}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View style={[styles.column, columnStyle]}>
        {DIGITS.map((value, index) => (
          <Text
            key={value}
            accessible={false}
            maximumFontSizeMultiplier={maximumFontSizeMultiplier}
            style={digitStyle}
          >
            {value}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}
