import { CATEGORY_BY_ID, type CategoryId } from "@/constants/categories";
import { CATEGORY_ICON } from "@/constants/expenses";
import { opacity, radii } from "@/theme/tokens";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

interface CategoryIconProps {
  categoryId: CategoryId;
  size?: number;
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  tint: {
    ...StyleSheet.absoluteFill,
    borderRadius: radii.pill,
    opacity: opacity.tint,
  },
});

export function CategoryIcon({
  categoryId,
  size = CATEGORY_ICON.defaultSize,
}: CategoryIconProps) {
  const category = CATEGORY_BY_ID[categoryId];
  const containerStyle = useMemo(
    () => [styles.container, { width: size, height: size }],
    [size],
  );
  const tintStyle = useMemo(
    () => [styles.tint, { backgroundColor: category.color }],
    [category.color],
  );
  const iconSize = Math.round(size * CATEGORY_ICON.iconScale);

  return (
    <View style={containerStyle} accessibilityElementsHidden>
      <View style={tintStyle} />
      <Ionicons name={category.icon} size={iconSize} color={category.color} />
    </View>
  );
}
