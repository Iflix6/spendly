import { Easing } from "react-native-reanimated";

export const springs = {
  snappy: { damping: 18, stiffness: 220, mass: 1 },
  soft: { damping: 20, stiffness: 140, mass: 1 },
  bouncy: { damping: 12, stiffness: 200, mass: 1 },
} as const;

export const durations = {
  fast: 150,
  base: 250,
  slow: 400,
  chart: 900,
  theme: 300,
} as const;

export const easing = {
  entrance: Easing.bezier(0.2, 0.8, 0.2, 1),
  standard: Easing.out(Easing.cubic),
} as const;
