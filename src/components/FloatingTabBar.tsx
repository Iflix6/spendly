import { ADD_ACTION, TAB_BAR, type TabIconName } from "@/constants/navigation";
import { selection } from "@/lib/haptics";
import { useAnimatedThemeColors, useTheme } from "@/theme/ThemeProvider";
import { layout, radii } from "@/theme/tokens";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { FloatingTabItem } from "./FloatingTabItem";

export interface FloatingTabRoute {
  key: string;
  title: string;
  icon: TabIconName;
}

interface FloatingTabBarProps {
  routes: readonly FloatingTabRoute[];
  activeIndex: number;
  bottomInset: number;
  onTabPress: (routeKey: string) => void;
  onAddPress: () => void;
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
  },
  bar: {
    position: "absolute",
    left: TAB_BAR.horizontalMargin,
    right: TAB_BAR.horizontalMargin,
    height: TAB_BAR.height,
    paddingTop: TAB_BAR.contentOffset,
    paddingBottom: TAB_BAR.contentOffset,
    borderTopWidth: layout.borderWidth,
    flexDirection: "row",
    alignItems: "center",
  },
  tabs: {
    flex: 1,
    height: TAB_BAR.itemHeight,
    flexDirection: "row",
  },
  addSlot: {
    flex: 1,
    height: TAB_BAR.itemHeight,
    alignItems: "center",
    justifyContent: "center",
  },
  addPressable: {
    width: "100%",
    height: "100%",
    minHeight: layout.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    width: ADD_ACTION.size,
    height: ADD_ACTION.size,
    borderRadius: radii.input,
    alignItems: "center",
    justifyContent: "center",
  },
});

export function FloatingTabBar({
  routes,
  activeIndex,
  bottomInset,
  onTabPress,
  onAddPress,
}: FloatingTabBarProps) {
  const { colors } = useTheme();
  const animatedColors = useAnimatedThemeColors();

  const handleTabPress = useCallback(
    (routeKey: string) => {
      if (routeKey !== routes[activeIndex]?.key) {
        void selection();
      }
      onTabPress(routeKey);
    },
    [activeIndex, onTabPress, routes],
  );
  const handleAddPress = useCallback(() => {
    void selection();
    onAddPress();
  }, [onAddPress]);

  const barStyle = useAnimatedStyle(() => ({
    bottom: 0,
    height: TAB_BAR.height + bottomInset,
    paddingBottom: TAB_BAR.contentOffset + bottomInset,
    backgroundColor: animatedColors.value.surface,
    borderTopColor: animatedColors.value.border,
  }));
  const addStyle = useAnimatedStyle(() => ({
    backgroundColor: animatedColors.value.accent,
  }));

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View style={[styles.bar, barStyle]}>
        <View style={styles.tabs}>
          {routes.map((route, index) => (
            <FloatingTabItem
              key={route.key}
              focused={index === activeIndex}
              icon={route.icon}
              label={route.title}
              routeKey={route.key}
              onPress={handleTabPress}
            />
          ))}
        </View>
        <View style={styles.addSlot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add expense"
            accessibilityHint="Opens the add expense screen"
            onPress={handleAddPress}
            style={({ pressed }) => [
              styles.addPressable,
              pressed && { transform: [{ scale: ADD_ACTION.pressedScale }] },
            ]}
          >
            <Animated.View style={[styles.addButton, addStyle]}>
              <Ionicons
                name="add"
                size={ADD_ACTION.iconSize}
                color={colors.onAccent}
              />
            </Animated.View>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}
