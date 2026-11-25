import { Card } from "@/components/Card";
import { CategoryIcon } from "@/components/CategoryIcon";
import type { Category, CategoryId } from "@/constants/categories";
import { AMOUNT_INPUT } from "@/constants/expenseForm";
import { CATEGORY_CARD } from "@/constants/home";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { formatMoney } from "@/lib/money";
import { springs } from "@/theme/motion";
import { useTheme } from "@/theme/ThemeProvider";
import {
    fontFamily,
    opacity,
    radii,
    spacing,
    tabularNums,
    typography,
} from "@/theme/tokens";
import { memo, useCallback, useEffect, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
    cancelAnimation,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";

interface CategoryCardProps {
  category: Category;
  amountCents: number;
  progress: number;
  onPress: (categoryId: CategoryId) => void;
}

const styles = StyleSheet.create({
  pressable: {
    width: CATEGORY_CARD.width,
  },
  card: {
    width: CATEGORY_CARD.width,
    minHeight: CATEGORY_CARD.minHeight,
    padding: spacing.base,
    gap: spacing.md,
  },
  label: {
    ...typography.body,
    fontFamily: fontFamily.semibold,
  },
  amount: {
    ...typography.headline,
    ...tabularNums,
  },
  track: {
    height: CATEGORY_CARD.progressHeight,
    borderRadius: radii.pill,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: radii.pill,
    transformOrigin: "left center",
  },
});

export const CategoryCard = memo(function CategoryCard({
  category,
  amountCents,
  progress,
  onPress,
}: CategoryCardProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotionSafe();
  const animatedProgress = useSharedValue(0);
  const pressScale = useSharedValue(1);
  const safeProgress = Math.min(1, Math.max(0, progress));
  const amount = formatMoney(amountCents);

  useEffect(() => {
    cancelAnimation(animatedProgress);
    animatedProgress.value = reduceMotion
      ? safeProgress
      : withSpring(safeProgress, springs.soft);
  }, [animatedProgress, reduceMotion, safeProgress]);

  useEffect(() => {
    return () => cancelAnimation(animatedProgress);
  }, [animatedProgress]);

  const progressStyle = useAnimatedStyle(() => ({
    opacity: animatedProgress.value > 0 ? 1 : opacity.subtle,
    transform: [{ scaleX: animatedProgress.value }],
  }));
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));
  const cardStyle = useMemo(() => styles.card, []);
  const fillStyle = useMemo(
    () => [styles.fill, { backgroundColor: category.color }],
    [category.color],
  );
  const trackStyle = useMemo(
    () => [styles.track, { backgroundColor: colors.surfaceAlt }],
    [colors.surfaceAlt],
  );
  const labelStyle = useMemo(
    () => [styles.label, { color: colors.text }],
    [colors.text],
  );
  const amountStyle = useMemo(
    () => [styles.amount, { color: colors.text }],
    [colors.text],
  );
  const handlePressIn = useCallback(() => {
    pressScale.value = reduceMotion
      ? 1
      : withSpring(CATEGORY_CARD.pressedScale, springs.snappy);
  }, [pressScale, reduceMotion]);
  const handlePressOut = useCallback(() => {
    pressScale.value = reduceMotion ? 1 : withSpring(1, springs.snappy);
  }, [pressScale, reduceMotion]);
  const handlePress = useCallback(() => {
    onPress(category.id);
  }, [category.id, onPress]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${category.label}, ${amount}. Show expenses`}
      accessibilityHint="Opens expenses filtered by this category"
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.pressable}
      testID={`category-card-${category.id}`}
    >
      <Animated.View style={scaleStyle}>
        <Card style={cardStyle}>
          <CategoryIcon categoryId={category.id} />
          <Text style={labelStyle} numberOfLines={1}>
            {category.label}
          </Text>
          <Text
            style={amountStyle}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={AMOUNT_INPUT.minimumFontScale}
          >
            {amount}
          </Text>
          <View style={trackStyle}>
            <Animated.View style={[fillStyle, progressStyle]} />
          </View>
        </Card>
      </Animated.View>
    </Pressable>
  );
});
