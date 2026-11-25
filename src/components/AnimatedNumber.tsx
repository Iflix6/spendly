import { KEYPAD_MAX_DECIMALS } from "@/constants";
import { ANIMATED_NUMBER } from "@/constants/home";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { tabularNums, typography } from "@/theme/tokens";
import { useMemo } from "react";
import {
    StyleSheet,
    Text,
    View,
    type StyleProp,
    type TextStyle,
} from "react-native";
import { AnimatedDigit } from "./AnimatedDigit";

interface AnimatedNumberProps {
  value: number;
  fractionDigits?: number;
  prefix?: string;
  suffix?: string;
  style?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  maxFontSizeMultiplier?: number;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export function formatAnimatedNumber(
  value: number,
  fractionDigits: number = ANIMATED_NUMBER.defaultFractionDigits,
): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  const precision = Math.max(
    0,
    Math.min(KEYPAD_MAX_DECIMALS, Math.round(fractionDigits)),
  );

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(safeValue);
}

export function AnimatedNumber({
  value,
  fractionDigits = ANIMATED_NUMBER.defaultFractionDigits,
  prefix = "",
  suffix = "",
  style,
  accessibilityLabel,
  maxFontSizeMultiplier,
}: AnimatedNumberProps) {
  const reduceMotion = useReducedMotionSafe();
  const flattenedStyle = StyleSheet.flatten(style);
  const fontSize = flattenedStyle?.fontSize ?? typography.body.fontSize;
  const digitHeight =
    flattenedStyle?.lineHeight ?? fontSize * ANIMATED_NUMBER.lineHeightRatio;
  const textStyle = useMemo<TextStyle>(
    () => ({
      ...typography.body,
      ...flattenedStyle,
      ...tabularNums,
      lineHeight: digitHeight,
    }),
    [digitHeight, flattenedStyle],
  );
  const formatted = useMemo(
    () => formatAnimatedNumber(value, fractionDigits),
    [fractionDigits, value],
  );
  const decimalIndex = formatted.indexOf(".");
  const integerPart =
    decimalIndex >= 0 ? formatted.slice(0, decimalIndex) : formatted;
  const fractionPart =
    decimalIndex >= 0 ? formatted.slice(decimalIndex + 1) : "";
  const label = `${prefix}${formatted}${suffix}`;

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel ?? label}
      style={styles.root}
    >
      {prefix.length > 0 ? (
        <Text
          accessible={false}
          maxFontSizeMultiplier={maxFontSizeMultiplier}
          style={textStyle}
        >
          {prefix}
        </Text>
      ) : null}
      {integerPart.split("").map((character, index) =>
        /\d/.test(character) ? (
          <AnimatedDigit
            key={`integer-${integerPart.length - index - 1}`}
            digit={Number(character)}
            digitHeight={digitHeight}
            reduceMotion={reduceMotion}
            style={textStyle}
            maxFontSizeMultiplier={maxFontSizeMultiplier}
          />
        ) : (
          <Text
            key={`integer-static-${index}`}
            accessible={false}
            maxFontSizeMultiplier={maxFontSizeMultiplier}
            style={textStyle}
          >
            {character}
          </Text>
        ),
      )}
      {decimalIndex >= 0 ? (
        <Text
          accessible={false}
          maxFontSizeMultiplier={maxFontSizeMultiplier}
          style={textStyle}
        >
          .
        </Text>
      ) : null}
      {fractionPart.split("").map((character, index) => (
        <AnimatedDigit
          key={`fraction-${index}`}
          digit={Number(character)}
          digitHeight={digitHeight}
          reduceMotion={reduceMotion}
          style={textStyle}
          maxFontSizeMultiplier={maxFontSizeMultiplier}
        />
      ))}
      {suffix.length > 0 ? (
        <Text
          accessible={false}
          maxFontSizeMultiplier={maxFontSizeMultiplier}
          style={textStyle}
        >
          {suffix}
        </Text>
      ) : null}
    </View>
  );
}
