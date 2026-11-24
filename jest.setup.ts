jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: { View },
    Easing: {
      bezier: () => () => 0,
      cubic: () => 0,
      out: () => () => 0,
    },
    interpolateColor: () => '#000000',
    useAnimatedStyle: (updater: () => unknown) => updater(),
    useDerivedValue: (updater: () => unknown) => ({ value: updater() }),
    useReducedMotion: () => false,
    useSharedValue: (value: unknown) => ({ value }),
    withTiming: (value: unknown) => value,
  };
});
