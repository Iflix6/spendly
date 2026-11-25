import { FAB, TAB_BAR, type TabIconName } from "@/constants/navigation";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { selection } from "@/lib/haptics";
import { springs } from "@/theme/motion";
import { useAnimatedThemeColors, useTheme } from "@/theme/ThemeProvider";
import { layout, opacity, radii, spacing } from "@/theme/tokens";
import { BlurView } from "expo-blur";
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ComponentRef,
    type RefObject,
} from "react";
import {
    Platform,
    StyleSheet,
    View,
    useWindowDimensions,
    type LayoutChangeEvent,
    type View as NativeView,
} from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import { Fab } from "./Fab";
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
  blurTarget?: RefObject<ComponentRef<typeof NativeView> | null>;
  onTabPress: (routeKey: string) => void;
}

const canBlur =
  Platform.OS === "ios" ||
  (Platform.OS === "android" &&
    typeof Platform.Version === "number" &&
    Platform.Version >= TAB_BAR.androidBlurMinApi);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
  },
  bar: {
    position: "absolute",
    left: TAB_BAR.horizontalMargin,
    right: TAB_BAR.horizontalMargin,
    height: TAB_BAR.height,
    borderRadius: radii.sheet,
    borderWidth: layout.borderWidth,
    overflow: "hidden",
  },
  background: {
    ...StyleSheet.absoluteFill,
    borderRadius: radii.sheet,
    overflow: "hidden",
  },
  tint: {
    ...StyleSheet.absoluteFill,
  },
  indicator: {
    position: "absolute",
    top: TAB_BAR.contentOffset,
    height: TAB_BAR.itemHeight,
    borderRadius: radii.pill,
  },
  tabs: {
    position: "absolute",
    left: 0,
    right: 0,
    top: TAB_BAR.contentOffset,
    height: TAB_BAR.itemHeight,
    flexDirection: "row",
  },
  notch: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
    width: FAB.size + spacing.base,
    height: TAB_BAR.notchHeight,
    borderBottomLeftRadius: radii.pill,
    borderBottomRightRadius: radii.pill,
  },
});

export function FloatingTabBar({
  routes,
  activeIndex,
  bottomInset,
  blurTarget,
  onTabPress,
}: FloatingTabBarProps) {
  const { isDark } = useTheme();
  const animatedColors = useAnimatedThemeColors();
  const reduceMotion = useReducedMotionSafe();
  const { width: windowWidth } = useWindowDimensions();
  const [trackWidth, setTrackWidth] = useState(() =>
    Math.max(
      windowWidth - TAB_BAR.horizontalMargin - TAB_BAR.horizontalMargin,
      0,
    ),
  );
  const routeCount = Math.max(routes.length, TAB_BAR.minimumRouteCount);
  const slotWidth = trackWidth / routeCount;
  const selectedIndex = useSharedValue(activeIndex);
  const animatedSlotWidth = useSharedValue(slotWidth);
  const previousActiveIndex = useRef(activeIndex);

  useEffect(() => {
    animatedSlotWidth.value = slotWidth;
  }, [animatedSlotWidth, slotWidth]);

  useEffect(() => {
    if (previousActiveIndex.current === activeIndex) {
      return;
    }
    selectedIndex.value = reduceMotion
      ? activeIndex
      : withSpring(activeIndex, springs.snappy);
    previousActiveIndex.current = activeIndex;
  }, [activeIndex, reduceMotion, selectedIndex]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  }, []);

  const handleTabPress = useCallback(
    (routeKey: string) => {
      if (routeKey !== routes[activeIndex]?.key) {
        void selection();
      }
      onTabPress(routeKey);
    },
    [activeIndex, onTabPress, routes],
  );

  const indicatorStyle = useAnimatedStyle(() => ({
    width: animatedSlotWidth.value,
    transform: [{ translateX: selectedIndex.value * animatedSlotWidth.value }],
  }));
  const borderStyle = useAnimatedStyle(() => ({
    borderColor: animatedColors.value.border,
  }));
  const fallbackStyle = useAnimatedStyle(() => ({
    backgroundColor: animatedColors.value.surface,
  }));
  const tintStyle = useAnimatedStyle(() => ({
    backgroundColor: animatedColors.value.surface,
    opacity: opacity.glass,
  }));
  const notchStyle = useAnimatedStyle(() => ({
    backgroundColor: animatedColors.value.bg,
  }));
  const fabBottomOffset = useMemo(
    () =>
      bottomInset + TAB_BAR.bottomMargin + TAB_BAR.height - TAB_BAR.fabOverlap,
    [bottomInset],
  );

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View style={[styles.bar, borderStyle]} onLayout={handleLayout}>
        {canBlur ? (
          <BlurView
            blurTarget={blurTarget}
            tint={isDark ? "dark" : "light"}
            intensity={TAB_BAR.blurIntensity}
            blurMethod={
              Platform.OS === "android" ? "dimezisBlurViewSdk31Plus" : undefined
            }
            style={styles.background}
            pointerEvents="none"
          />
        ) : (
          <Animated.View
            style={[styles.background, fallbackStyle]}
            pointerEvents="none"
          />
        )}
        {canBlur ? (
          <Animated.View
            style={[styles.tint, tintStyle]}
            pointerEvents="none"
          />
        ) : null}
        <Animated.View
          style={[styles.indicator, indicatorStyle]}
          pointerEvents="none"
        />
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
        <Animated.View
          style={[styles.notch, notchStyle]}
          pointerEvents="none"
        />
      </Animated.View>
      <Fab bottomOffset={fabBottomOffset} />
    </View>
  );
}
