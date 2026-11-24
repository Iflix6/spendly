import type { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

export type TabIconName = ComponentProps<typeof Ionicons>["name"];

export const TAB_BAR = {
  height: 80,
  bottomMargin: 12,
  horizontalMargin: 16,
  contentOffset: 20,
  itemHeight: 52,
  notchHeight: 20,
  iconSize: 22,
  blurIntensity: 48,
  androidBlurMinApi: 31,
  fabOverlap: 20,
  minimumRouteCount: 1,
} as const;

export const FAB = {
  size: 56,
  iconSize: 28,
  rotationDegrees: 45,
  pressedScale: 0.94,
  glowScale: 1.18,
} as const;

export const TAB_MOTION = {
  iconBounceDuration: 100,
  iconPeakScale: 1.2,
} as const;

export const TAB_ICONS: Readonly<Partial<Record<string, TabIconName>>> = {
  index: "home-outline",
  expenses: "receipt-outline",
  stats: "bar-chart-outline",
};
