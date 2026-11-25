import { useTheme } from "@/theme/ThemeProvider";
import { layout, lightCardShadow, radii } from "@/theme/tokens";
import { useMemo, type ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

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
  const { colors, isDark } = useTheme();
  const cardStyle = useMemo(
    () => [
      styles.card,
      {
        backgroundColor: colors.surface,
        borderColor: isDark ? colors.border : colors.surface,
      },
      isDark ? null : lightCardShadow,
      style,
    ],
    [colors.border, colors.surface, isDark, style],
  );

  return <View style={cardStyle}>{children}</View>;
}
