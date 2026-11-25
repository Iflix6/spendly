import type { TextStyle } from "react-native";

export interface ThemeColors {
  bg: string;
  backdrop: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  mutedText: string;
  accent: string;
  accentText: string;
  accentAlt: string;
  accentDeep: string;
  onAccent: string;
  success: string;
  successText: string;
  warning: string;
  danger: string;
  dangerText: string;
  onDanger: string;
}

export const lightColors: ThemeColors = {
  bg: "#FFFFFF",
  backdrop: "#000000",
  surface: "#FFFFFF",
  surfaceAlt: "#FFF4F4",
  border: "#F0DADD",
  text: "#191919",
  textMuted: "#737373",
  mutedText: "#666666",
  accent: "#D71920",
  accentText: "#B42318",
  accentAlt: "#EF4444",
  accentDeep: "#991B1B",
  onAccent: "#FFFFFF",
  success: "#187A52",
  successText: "#137333",
  warning: "#A15C00",
  danger: "#B42318",
  dangerText: "#B42318",
  onDanger: "#FFFFFF",
};

export const darkColors: ThemeColors = {
  bg: "#121212",
  backdrop: "#000000",
  surface: "#1C1C1C",
  surfaceAlt: "#2A1A1C",
  border: "#3D2A2C",
  text: "#FAFAFA",
  textMuted: "#B8B8B8",
  mutedText: "#C4C4C4",
  accent: "#E12D36",
  accentText: "#FF7A7F",
  accentAlt: "#F05252",
  accentDeep: "#B42318",
  onAccent: "#FFFFFF",
  success: "#34C98B",
  successText: "#5BDAA4",
  warning: "#F5B83D",
  danger: "#F05252",
  dangerText: "#FF8A8F",
  onDanger: "#FFFFFF",
};

export const splashColors = {
  background: "#D71920",
  backgroundBottom: "#B42318",
  foreground: "#FFFFFF",
  shimmerTransparent: "#FFFFFF00",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  input: 12,
  card: 16,
  sheet: 24,
  pill: 999,
} as const;

export const layout = {
  minTouchTarget: 44,
  borderWidth: 1,
  indicatorSize: 8,
} as const;

export const opacity = {
  subtle: 0.08,
  muted: 0.65,
  tint: 0.12,
  glass: 0.72,
  modal: 0.96,
} as const;

export const letterSpacing = {
  label: 1,
  wide: 1.4,
} as const;

export const fontFamily = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
} as const;

export const typography = {
  display: {
    fontSize: 40,
    lineHeight: 44,
    fontFamily: fontFamily.bold,
    fontWeight: "700",
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: fontFamily.bold,
    fontWeight: "700",
  },
  headline: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: fontFamily.semibold,
    fontWeight: "600",
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fontFamily.regular,
    fontWeight: "400",
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fontFamily.medium,
    fontWeight: "500",
  },
} as const satisfies Record<string, TextStyle>;

export const tabularNums = {
  fontVariant: ["tabular-nums"],
} satisfies TextStyle;

export const lightCardShadow = {
  shadowColor: "#000000",
  shadowOpacity: 0.04,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} satisfies TextStyle;
