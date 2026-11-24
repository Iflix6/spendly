import {
  createContext,
  useContext,
  type ComponentRef,
  type RefObject,
} from "react";
import type { View } from "react-native";

export type TabBlurTargetRef = RefObject<ComponentRef<typeof View> | null>;

export const TabBlurTargetContext = createContext<TabBlurTargetRef | null>(null);

export function useTabBlurTarget(): TabBlurTargetRef | null {
  return useContext(TabBlurTargetContext);
}
