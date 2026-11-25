import { PERCENT_PRECISION } from "@/constants";
import { DELTA_PILL } from "@/constants/stats";
import { useTheme } from "@/theme/ThemeProvider";
import {
    fontFamily,
    layout,
    opacity,
    radii,
    spacing,
    tabularNums,
    typography,
} from "@/theme/tokens";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

interface DeltaPillProps {
  deltaPercent: number;
  previousTotalCents: number;
}

const styles = StyleSheet.create({
  container: {
    minHeight: DELTA_PILL.minHeight,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    maxWidth: "100%",
    gap: spacing.xs,
    paddingHorizontal: DELTA_PILL.horizontalPadding,
    borderRadius: radii.pill,
    overflow: "hidden",
  },
  content: {
    flexShrink: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  tint: {
    ...StyleSheet.absoluteFill,
  },
  label: {
    ...typography.caption,
    ...tabularNums,
    fontFamily: fontFamily.semibold,
    flexShrink: 1,
  },
});

export function DeltaPill({
  deltaPercent,
  previousTotalCents,
}: DeltaPillProps) {
  const { colors } = useTheme();
  const hasPrevious = previousTotalCents > 0;
  const isLower = hasPrevious && deltaPercent < 0;
  const isHigher = hasPrevious && deltaPercent > 0;
  const statusColor = isLower
    ? colors.successText
    : isHigher
      ? colors.dangerText
      : colors.mutedText;
  const tintColor = isLower
    ? colors.success
    : isHigher
      ? colors.danger
      : colors.mutedText;
  const icon = isLower
    ? "trending-down-outline"
    : isHigher
      ? "trending-up-outline"
      : "remove-outline";
  const label = !hasPrevious
    ? "No prior month"
    : `${Math.abs(deltaPercent).toFixed(PERCENT_PRECISION)}% vs last month`;
  const accessibilityLabel = !hasPrevious
    ? "No spending in the previous month"
    : isLower
      ? `Down ${label}`
      : isHigher
        ? `Up ${label}`
        : label;
  const containerStyle = useMemo(
    () => [
      styles.container,
      {
        backgroundColor: hasPrevious ? colors.surface : colors.surfaceAlt,
        borderWidth: hasPrevious ? 0 : layout.borderWidth,
        borderColor: colors.border,
      },
    ],
    [colors.border, colors.surface, colors.surfaceAlt, hasPrevious],
  );
  const tintStyle = useMemo(
    () => [styles.tint, { backgroundColor: tintColor, opacity: opacity.tint }],
    [tintColor],
  );
  const labelStyle = useMemo(
    () => [styles.label, { color: statusColor }],
    [statusColor],
  );

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityLiveRegion="polite"
      style={containerStyle}
    >
      {hasPrevious ? <View style={tintStyle} pointerEvents="none" /> : null}
      <View style={styles.content} pointerEvents="none">
        <Ionicons name={icon} size={DELTA_PILL.iconSize} color={statusColor} />
        <Text numberOfLines={1} adjustsFontSizeToFit style={labelStyle}>
          {label}
        </Text>
      </View>
    </View>
  );
}
