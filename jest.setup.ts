jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("react-native-reanimated", () => {
  const { Text, View } = require("react-native");
  const createBuilder = () => {
    const builder: {
      duration: () => unknown;
      delay: () => unknown;
      easing: () => unknown;
    } = {
      duration: () => builder,
      delay: () => builder,
      easing: () => builder,
    };
    return builder;
  };
  const createAnimation = () => ({ duration: () => createBuilder() });

  return {
    __esModule: true,
    default: { Text, View },
    Easing: {
      bezier: () => () => 0,
      cubic: () => 0,
      out: () => () => 0,
    },
    FadeIn: createAnimation(),
    FadeInDown: createAnimation(),
    FadeOut: createAnimation(),
    FadeOutDown: createAnimation(),
    LinearTransition: createAnimation(),
    SlideInUp: createAnimation(),
    cancelAnimation: () => undefined,
    interpolate: (value: number) => value,
    interpolateColor: () => "#000000",
    runOnJS: (callback: (...args: unknown[]) => unknown) => callback,
    useAnimatedStyle: (updater: () => unknown) => updater(),
    useDerivedValue: (updater: () => unknown) => ({ value: updater() }),
    useReducedMotion: () => false,
    useSharedValue: (value: unknown) => ({ value }),
    withRepeat: (animation: unknown) => animation,
    withSequence: (...values: unknown[]) => values[values.length - 1],
    withSpring: (value: unknown) => value,
    withTiming: (value: unknown) => value,
  };
});

jest.mock("expo-blur", () => {
  const { View } = require("react-native");
  return { BlurTargetView: View, BlurView: View };
});

jest.mock("expo-linear-gradient", () => {
  const { View } = require("react-native");
  return { LinearGradient: View };
});

jest.mock("react-native-gesture-handler", () => {
  const { View } = require("react-native");
  const gesture: Record<string, unknown> = {};
  const methods = [
    "activeOffsetX",
    "failOffsetY",
    "onStart",
    "onUpdate",
    "onEnd",
    "onFinalize",
  ];

  for (const method of methods) {
    gesture[method] = () => gesture;
  }

  return {
    Gesture: { Pan: () => gesture },
    GestureDetector: ({ children }: { children: unknown }) => children,
    GestureHandlerRootView: View,
  };
});

jest.mock("@shopify/react-native-skia", () => {
  const React = require("react");
  const { View } = require("react-native");
  const Shape = ({ children }: { children?: unknown }) =>
    React.createElement(View, null, children);

  return {
    Canvas: Shape,
    Circle: Shape,
    Group: Shape,
    Line: Shape,
    RoundedRect: Shape,
  };
});
