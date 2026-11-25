import type Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";

export type TabIconName = ComponentProps<typeof Ionicons>["name"];

export const TAB_BAR = {
  height: 72,
  bottomMargin: 0,
  horizontalMargin: 0,
  contentOffset: 6,
  itemHeight: 56,
  iconSize: 22,
  pressedScale: 0.94,
} as const;

export const ADD_ACTION = {
  size: 44,
  iconSize: 24,
  pressedScale: 0.94,
} as const;

export const TAB_ICONS: Readonly<Partial<Record<string, TabIconName>>> = {
  index: "home-outline",
  expenses: "receipt-outline",
  stats: "bar-chart-outline",
};
