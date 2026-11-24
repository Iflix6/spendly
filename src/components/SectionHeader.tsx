import { formatMoney } from "@/lib/money";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing, tabularNums, typography } from "@/theme/tokens";
import { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

interface SectionHeaderProps {
  title: string;
  totalCents: number;
}

const styles = StyleSheet.create({
  container: {
    minHeight: spacing.xxl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.base,
  },
  title: typography.headline,
  total: {
    ...typography.body,
    ...tabularNums,
  },
});

export const SectionHeader = memo(function SectionHeader({
  title,
  totalCents,
}: SectionHeaderProps) {
  const { colors } = useTheme();
  const containerStyle = useMemo(
    () => [styles.container, { backgroundColor: colors.bg }],
    [colors.bg],
  );
  const titleStyle = useMemo(
    () => [styles.title, { color: colors.text }],
    [colors.text],
  );
  const totalStyle = useMemo(
    () => [styles.total, { color: colors.textMuted }],
    [colors.textMuted],
  );

  return (
    <View style={containerStyle} accessibilityRole="header">
      <Text style={titleStyle} numberOfLines={1}>
        {title}
      </Text>
      <Text style={totalStyle}>{formatMoney(totalCents)}</Text>
    </View>
  );
});
