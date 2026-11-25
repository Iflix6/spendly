import {
    FloatingTabBar,
    type FloatingTabRoute,
} from "@/components/FloatingTabBar";
import { TAB_ICONS } from "@/constants/navigation";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { Tabs, useRouter } from "expo-router";
import { useCallback, type ComponentProps } from "react";

type TabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>["tabBar"]>
>[0];

export default function TabsLayout() {
  const reduceMotion = useReducedMotionSafe();
  const router = useRouter();

  const handleAddPress = useCallback(() => {
    router.push("/add");
  }, [router]);
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
          onTabPress={props.navigateToTab}
          onAddPress={handleAddPress}
        />
      );
    },
    [handleAddPress],
  );

  return (
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
  );
}
