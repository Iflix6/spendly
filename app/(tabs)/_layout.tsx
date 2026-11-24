import {
    FloatingTabBar,
    type FloatingTabRoute,
} from "@/components/FloatingTabBar";
import { TabBlurTargetContext } from "@/components/TabBlurTargetContext";
import { TAB_ICONS } from "@/constants/navigation";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { Tabs } from "expo-router";
import {
    useCallback,
    useRef,
    type ComponentProps,
    type ComponentRef,
} from "react";
import type { View } from "react-native";

type TabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>["tabBar"]>
>[0];

export default function TabsLayout() {
  const reduceMotion = useReducedMotionSafe();
  const blurTarget = useRef<ComponentRef<typeof View>>(null);

  const renderTabBar = useCallback(
    (props: TabBarProps) => {
      const routes: FloatingTabRoute[] = props.state.routes.map((route) => ({
        key: route.key,
        title: props.descriptors[route.key]?.options.title ?? route.name,
        icon: TAB_ICONS[route.name] ?? "home-outline",
      }));

      return (
        <FloatingTabBar
          routes={routes}
          activeIndex={props.state.index}
          bottomInset={props.insets.bottom}
          blurTarget={blurTarget}
          onTabPress={props.navigateToTab}
        />
      );
    },
    [blurTarget],
  );

  return (
    <TabBlurTargetContext.Provider value={blurTarget}>
      <Tabs
        screenOptions={{
          headerShown: false,
          animation: reduceMotion ? "none" : "fade",
          sceneStyle: { backgroundColor: "transparent" },
        }}
        tabBar={renderTabBar}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="expenses" options={{ title: "Expenses" }} />
        <Tabs.Screen name="stats" options={{ title: "Stats" }} />
      </Tabs>
    </TabBlurTargetContext.Provider>
  );
}
