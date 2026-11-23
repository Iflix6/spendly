import { useReducedMotion } from "react-native-reanimated";

export function useReducedMotionSafe(): boolean {
  return useReducedMotion();
}
