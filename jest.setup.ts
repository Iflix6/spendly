jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock(
  "react-native-reanimated",
  () => {
    const React = require("react") as typeof import("react");
    const { Pressable, Text, View } = require("react-native");
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
      default: {
        Pressable,
        Text,
        View,
        createAnimatedComponent: (component: unknown) => component,
      },
      Easing: {
        bezier: () => () => 0,
        cubic: () => 0,
        linear: () => 0,
        out: () => () => 0,
      },
      FadeIn: createAnimation(),
      FadeInDown: createAnimation(),
      FadeOut: createAnimation(),
      FadeOutDown: createAnimation(),
      LinearTransition: createAnimation(),
      SlideInLeft: createAnimation(),
      SlideInRight: createAnimation(),
      SlideInUp: createAnimation(),
      cancelAnimation: () => undefined,
      interpolate: (value: number) => value,
      interpolateColor: () => "#000000",
      runOnJS: (callback: (...args: unknown[]) => unknown) => callback,
      useAnimatedKeyboard: () => ({
        height: { value: 0 },
        state: { value: 0 },
      }),
      useAnimatedReaction: (
        prepare: () => unknown,
        react: (current: unknown, previous: unknown) => void,
      ) => {
        const previous = React.useRef<unknown>(null);
        React.useEffect(() => {
          const current = prepare();
          react(current, previous.current);
          previous.current = current;
        });
      },
      useAnimatedStyle: (updater: () => unknown) => updater(),
      useDerivedValue: (updater: () => unknown) => {
        const ref = React.useRef<{ value: unknown }>({ value: updater() });
        ref.current.value = updater();
        return ref.current;
      },
      useReducedMotion: () => false,
      useSharedValue: (value: unknown) => {
        const ref = React.useRef({ value });
        ref.current.value = value;
        return ref.current;
      },
      withDelay: (_delay: number, animation: unknown) => animation,
      withRepeat: (animation: unknown) => animation,
      withSequence: (...values: unknown[]) => values[values.length - 1],
      withSpring: (
        value: unknown,
        _config?: unknown,
        callback?: (finished: boolean) => void,
      ) => {
        callback?.(true);
        return value;
      },
      withTiming: (
        value: unknown,
        _config?: unknown,
        callback?: (finished: boolean) => void,
      ) => {
        callback?.(true);
        return value;
      },
    };
  },
  { virtual: true },
);

jest.mock("react-native-gesture-handler", () => {
  const { View } = require("react-native");
  const gesture: Record<string, unknown> = {};
  const methods = [
    "activeOffsetX",
    "activeOffsetY",
    "enabled",
    "failOffsetX",
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
  const Canvas = (props: { children?: unknown }) =>
    React.createElement(View, props, props.children);
  const pathBuilder: Record<string, () => unknown> = {};
  for (const method of ["moveTo", "lineTo", "quadTo", "addArc", "close"]) {
    pathBuilder[method] = () => pathBuilder;
  }
  pathBuilder.build = () => ({});
  pathBuilder.detach = () => ({});

  return {
    Canvas,
    Circle: Shape,
    Group: Shape,
    Line: Shape,
    LinearGradient: Shape,
    Path: Shape,
    Rect: Shape,
    RoundedRect: Shape,
    Skia: { PathBuilder: { Make: () => pathBuilder } },
  };
});
