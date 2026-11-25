import {
    SPLASH_MARK_GEOMETRY,
    SPLASH_TAGLINE,
    SPLASH_WORDMARK,
} from "@/constants/splash";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { lightImpact } from "@/lib/haptics";
import { getSplashRevealDurationMs, shouldRevealSplash } from "@/lib/splash";
import {
    createSplashMarkPaths,
    type SplashPathCommand,
} from "@/lib/splashPaths";
import { easing, splash, splashClockEasing, springs } from "@/theme/motion";
import { fontFamily, splashColors, typography } from "@/theme/tokens";
import {
    Canvas,
    Circle,
    Group,
    LinearGradient,
    Path,
    Rect,
    Skia,
} from "@shopify/react-native-skia";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
    cancelAnimation,
    interpolate,
    runOnJS,
    useAnimatedReaction,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withDelay,
    withSequence,
    withSpring,
    withTiming,
    type SharedValue,
} from "react-native-reanimated";

interface AnimatedSplashProps {
  isAppReady: boolean;
  onFirstFrame: () => void;
  onFinish: () => void;
}

const WORDMARK_LETTERS = Array.from(SPLASH_WORDMARK);
const COIN_SLOT_X = SPLASH_MARK_GEOMETRY.coinSlotX * splash.markSize;
const COIN_SLOT_Y = SPLASH_MARK_GEOMETRY.coinSlotY * splash.markSize;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: splash.overlayZIndex,
    overflow: "hidden",
    backgroundColor: splashColors.background,
  },
  backgroundCanvas: {
    ...StyleSheet.absoluteFill,
  },
  content: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  markCanvas: {
    width: splash.markSize,
    height: splash.markSize,
  },
  wordmark: {
    flexDirection: "row",
    alignItems: "center",
    height: splash.wordmarkLineHeight,
    marginTop: splash.wordmarkGap,
  },
  letter: {
    color: splashColors.foreground,
    fontFamily: fontFamily.bold,
    fontSize: splash.wordmarkFontSize,
    fontWeight: "700",
    letterSpacing: splash.wordmarkLetterSpacing,
    lineHeight: splash.wordmarkLineHeight,
    includeFontPadding: false,
  },
  tagline: {
    ...typography.caption,
    color: splashColors.foreground,
    marginTop: splash.taglineGap,
  },
});

function createSkiaPath(commands: SplashPathCommand[]) {
  const builder = Skia.PathBuilder.Make();

  for (const command of commands) {
    switch (command.kind) {
      case "moveTo":
        builder.moveTo(command.x, command.y);
        break;
      case "lineTo":
        builder.lineTo(command.x, command.y);
        break;
      case "quadTo":
        builder.quadTo(
          command.controlX,
          command.controlY,
          command.x,
          command.y,
        );
        break;
      case "close":
        builder.close();
        break;
    }
  }

  return builder.detach();
}

function useSplashLetterStyle(
  progress: SharedValue<number>,
  index: number,
  reduceMotion: boolean,
) {
  return useAnimatedStyle(() => {
    if (reduceMotion) {
      return { opacity: 1, transform: [{ translateY: 0 }] };
    }

    const start =
      (index * splash.wordmarkStaggerMs) / splash.wordmarkDurationMs;
    const end =
      (index * splash.wordmarkStaggerMs + splash.wordmarkLetterDurationMs) /
      splash.wordmarkDurationMs;

    return {
      opacity: interpolate(progress.value, [start, end], [0, 1]),
      transform: [
        {
          translateY: interpolate(
            progress.value,
            [start, end],
            [splash.wordmarkSlide, 0],
          ),
        },
      ],
    };
  });
}

export function AnimatedSplash({
  isAppReady,
  onFirstFrame,
  onFinish,
}: AnimatedSplashProps) {
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotionSafe();
  const reduceMotionAtMount = useRef(reduceMotion).current;
  const [finished, setFinished] = useState(false);
  const firstFrameHandled = useRef(false);
  const introStarted = useRef(false);

  const introOpacity = useSharedValue(reduceMotion ? 0 : 1);
  const drawProgress = useSharedValue(reduceMotion ? 1 : 0);
  const coinDrop = useSharedValue(reduceMotion ? 1 : 0);
  const coinSquash = useSharedValue(1);
  const fillProgress = useSharedValue(reduceMotion ? 1 : 0);
  const pulseScale = useSharedValue(1);
  const wordmarkProgress = useSharedValue(reduceMotion ? 1 : 0);
  const taglineProgress = useSharedValue(reduceMotion ? 1 : 0);
  const shimmerProgress = useSharedValue(0);
  const revealProgress = useSharedValue(0);
  const elapsedMs = useSharedValue(0);
  const appReady = useSharedValue(isAppReady);
  const impactHandled = useSharedValue(false);
  const revealStarted = useSharedValue(false);

  const markPaths = useMemo(() => {
    const paths = createSplashMarkPaths(splash.markSize);
    return {
      body: createSkiaPath(paths.body),
      slot: createSkiaPath(paths.slot),
      detail: createSkiaPath(paths.detail),
    };
  }, []);

  useEffect(() => {
    appReady.value = isAppReady;
  }, [appReady, isAppReady]);

  useEffect(() => {
    if (introStarted.current) {
      return;
    }
    introStarted.current = true;

    if (reduceMotionAtMount) {
      introOpacity.value = withTiming(1, {
        duration: splash.reduced.fadeInDurationMs,
        easing: easing.standard,
      });
    } else {
      drawProgress.value = withTiming(1, {
        duration: splash.drawDurationMs,
        easing: easing.entrance,
      });
      coinDrop.value = withDelay(
        splash.coinDropStartMs,
        withSpring(1, springs.bouncy),
      );
      fillProgress.value = withDelay(
        splash.fillStartMs,
        withTiming(1, {
          duration: splash.fillDurationMs,
          easing: easing.standard,
        }),
      );
      pulseScale.value = withDelay(
        splash.pulseStartMs,
        withSequence(
          withSpring(splash.pulseScale, springs.soft),
          withSpring(1, springs.soft),
        ),
      );
      wordmarkProgress.value = withDelay(
        splash.wordmarkStartMs,
        withTiming(1, {
          duration: splash.wordmarkDurationMs,
          easing: splashClockEasing,
        }),
      );
      taglineProgress.value = withDelay(
        splash.taglineStartMs,
        withTiming(1, {
          duration: splash.taglineDurationMs,
          easing: easing.entrance,
        }),
      );
      shimmerProgress.value = withDelay(
        splash.shimmerStartMs,
        withTiming(1, {
          duration: splash.shimmerDurationMs,
          easing: easing.standard,
        }),
      );
    }

    elapsedMs.value = withTiming(splash.maximumVisibleMs, {
      duration: splash.maximumVisibleMs,
      easing: splashClockEasing,
    });

    return () => {
      cancelAnimation(introOpacity);
      cancelAnimation(drawProgress);
      cancelAnimation(coinDrop);
      cancelAnimation(coinSquash);
      cancelAnimation(fillProgress);
      cancelAnimation(pulseScale);
      cancelAnimation(wordmarkProgress);
      cancelAnimation(taglineProgress);
      cancelAnimation(shimmerProgress);
      cancelAnimation(revealProgress);
      cancelAnimation(elapsedMs);
    };
  }, [
    coinDrop,
    coinSquash,
    drawProgress,
    elapsedMs,
    fillProgress,
    introOpacity,
    pulseScale,
    reduceMotionAtMount,
    revealProgress,
    shimmerProgress,
    taglineProgress,
    wordmarkProgress,
  ]);

  useAnimatedReaction(
    () => coinDrop.value,
    (current, previous) => {
      if (
        reduceMotionAtMount ||
        impactHandled.value ||
        current < 1 ||
        (previous ?? 0) >= 1
      ) {
        return;
      }

      impactHandled.value = true;
      coinSquash.value = withSequence(
        withTiming(splash.coinSquashScaleY, {
          duration: splash.coinSquashDurationMs,
          easing: easing.standard,
        }),
        withSpring(1, springs.snappy),
      );
      runOnJS(lightImpact)();
    },
  );

  const handleFinish = useCallback(() => {
    setFinished(true);
    onFinish();
  }, [onFinish]);

  useAnimatedReaction(
    () => ({ elapsed: elapsedMs.value, ready: appReady.value }),
    (current) => {
      if (
        revealStarted.value ||
        !shouldRevealSplash({
          isAppReady: current.ready,
          elapsedMs: current.elapsed,
          reduceMotion: reduceMotionAtMount,
        })
      ) {
        return;
      }

      revealStarted.value = true;
      const revealDurationMs = getSplashRevealDurationMs({
        elapsedMs: current.elapsed,
        reduceMotion: reduceMotionAtMount,
      });

      if (revealDurationMs === 0) {
        revealProgress.value = 1;
        runOnJS(handleFinish)();
        return;
      }

      revealProgress.value = withTiming(
        1,
        {
          duration: revealDurationMs,
          easing: easing.standard,
        },
        (didFinish) => {
          if (didFinish) {
            runOnJS(handleFinish)();
          }
        },
      );
    },
  );

  const handleLayout = useCallback(() => {
    if (firstFrameHandled.current) {
      return;
    }
    firstFrameHandled.current = true;
    onFirstFrame();
  }, [onFirstFrame]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: 1 - revealProgress.value,
    transform: [
      {
        scale: reduceMotion
          ? 1
          : interpolate(revealProgress.value, [0, 1], [1, splash.revealScale]),
      },
    ],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: introOpacity.value,
    transform: [
      {
        translateY:
          -splash.contentOffsetY +
          (reduceMotion
            ? 0
            : interpolate(
                revealProgress.value,
                [0, 1],
                [0, -splash.revealTranslateY],
              )),
      },
    ],
  }));

  const fillOpacity = useDerivedValue(() =>
    interpolate(fillProgress.value, [0, 1], [0, splash.fillOpacity]),
  );
  const markTransform = useDerivedValue(() => [
    { scale: reduceMotion ? 1 : pulseScale.value },
  ]);
  const coinY = useDerivedValue(() =>
    interpolate(coinDrop.value, [0, 1], [-splash.coinSize, COIN_SLOT_Y], {
      extrapolateRight: "extend",
    }),
  );
  const coinTransform = useDerivedValue(() => [
    { translateY: coinY.value },
    { scaleY: reduceMotion ? 1 : coinSquash.value },
  ]);
  const shimmerStart = useDerivedValue(() => ({
    x: interpolate(
      shimmerProgress.value,
      [0, 1],
      [-splash.markSize, splash.markSize * splash.shimmerTravelRatio],
    ),
    y: 0,
  }));
  const shimmerEnd = useDerivedValue(() => ({
    x: shimmerStart.value.x + splash.markSize * splash.shimmerWidthRatio,
    y: 0,
  }));
  const shimmerOpacity = useDerivedValue(() =>
    reduceMotion
      ? 0
      : interpolate(
          shimmerProgress.value,
          [0, splash.shimmerFadeInRatio, splash.shimmerFadeOutRatio, 1],
          [0, splash.shimmerOpacity, splash.shimmerOpacity, 0],
        ),
  );
  const taglineStyle = useAnimatedStyle(() => ({
    opacity: splash.taglineOpacity * taglineProgress.value,
  }));

  const letterS = useSplashLetterStyle(wordmarkProgress, 0, reduceMotion);
  const letterP = useSplashLetterStyle(wordmarkProgress, 1, reduceMotion);
  const letterE = useSplashLetterStyle(wordmarkProgress, 2, reduceMotion);
  const letterN = useSplashLetterStyle(wordmarkProgress, 3, reduceMotion);
  const letterD = useSplashLetterStyle(wordmarkProgress, 4, reduceMotion);
  const letterL = useSplashLetterStyle(wordmarkProgress, 5, reduceMotion);
  const letterY = useSplashLetterStyle(wordmarkProgress, 6, reduceMotion);

  if (finished) {
    return null;
  }

  return (
    <>
      <StatusBar style="light" />
      <Animated.View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        onLayout={handleLayout}
        onStartShouldSetResponder={() => true}
        pointerEvents="auto"
        style={[styles.overlay, overlayStyle]}
      >
        <Canvas opaque pointerEvents="none" style={styles.backgroundCanvas}>
          <Rect x={0} y={0} width={width} height={height}>
            <LinearGradient
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: height }}
              colors={[splashColors.background, splashColors.backgroundBottom]}
            />
          </Rect>
        </Canvas>

        <Animated.View style={[styles.content, contentStyle]}>
          <Canvas style={styles.markCanvas}>
            <Group
              transform={markTransform}
              origin={{ x: splash.markSize / 2, y: splash.markSize / 2 }}
            >
              <Path
                path={markPaths.body}
                start={0}
                end={1}
                color={splashColors.foreground}
                opacity={fillOpacity}
              />
              <Path
                path={markPaths.body}
                start={0}
                end={reduceMotion ? 1 : drawProgress}
                color={splashColors.foreground}
                strokeWidth={splash.markStrokeWidth}
                strokeCap="round"
                strokeJoin="round"
              />
              <Path
                path={markPaths.slot}
                start={0}
                end={reduceMotion ? 1 : drawProgress}
                color={splashColors.foreground}
                strokeWidth={splash.markStrokeWidth}
                strokeCap="round"
                strokeJoin="round"
              />
              <Path
                path={markPaths.detail}
                start={0}
                end={reduceMotion ? 1 : drawProgress}
                color={splashColors.foreground}
                strokeWidth={splash.markStrokeWidth}
                strokeCap="round"
                strokeJoin="round"
              />
              <Path
                path={markPaths.body}
                start={0}
                end={1}
                opacity={shimmerOpacity}
              >
                <LinearGradient
                  start={shimmerStart}
                  end={shimmerEnd}
                  colors={[
                    splashColors.shimmerTransparent,
                    splashColors.foreground,
                    splashColors.shimmerTransparent,
                  ]}
                />
              </Path>
              <Group
                transform={coinTransform}
                origin={{ x: COIN_SLOT_X, y: 0 }}
              >
                <Circle
                  cx={COIN_SLOT_X}
                  cy={0}
                  r={splash.coinSize / 2}
                  color={splashColors.foreground}
                />
              </Group>
            </Group>
          </Canvas>

          <View style={styles.wordmark}>
            <Animated.Text style={[styles.letter, letterS]}>
              {WORDMARK_LETTERS[0]}
            </Animated.Text>
            <Animated.Text style={[styles.letter, letterP]}>
              {WORDMARK_LETTERS[1]}
            </Animated.Text>
            <Animated.Text style={[styles.letter, letterE]}>
              {WORDMARK_LETTERS[2]}
            </Animated.Text>
            <Animated.Text style={[styles.letter, letterN]}>
              {WORDMARK_LETTERS[3]}
            </Animated.Text>
            <Animated.Text style={[styles.letter, letterD]}>
              {WORDMARK_LETTERS[4]}
            </Animated.Text>
            <Animated.Text style={[styles.letter, letterL]}>
              {WORDMARK_LETTERS[5]}
            </Animated.Text>
            <Animated.Text style={[styles.letter, letterY]}>
              {WORDMARK_LETTERS[6]}
            </Animated.Text>
          </View>

          <Animated.Text style={[styles.tagline, taglineStyle]}>
            {SPLASH_TAGLINE}
          </Animated.Text>
        </Animated.View>
      </Animated.View>
    </>
  );
}
