import { BAR_CHART } from "@/constants/stats";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { springs } from "@/theme/motion";
import { Group, LinearGradient, Path, Skia } from "@shopify/react-native-skia";
import { useEffect, useMemo } from "react";
import {
    cancelAnimation,
    useDerivedValue,
    useSharedValue,
    withDelay,
    withSpring,
} from "react-native-reanimated";

interface BarShapeProps {
  x: number;
  baseline: number;
  width: number;
  amountCents: number;
  axisMaxCents: number;
  plotHeight: number;
  index: number;
  isTallest: boolean;
  accent: string;
  accentAlt: string;
}

export function BarShape({
  x,
  baseline,
  width,
  amountCents,
  axisMaxCents,
  plotHeight,
  index,
  isTallest,
  accent,
  accentAlt,
}: BarShapeProps) {
  const reduceMotion = useReducedMotionSafe();
  const progress = useSharedValue(0);
  const targetHeight =
    axisMaxCents > 0 ? (amountCents / axisMaxCents) * plotHeight : 0;
  const gradientPoints = useMemo(
    () => ({
      start: { x: x + width / 2, y: baseline - targetHeight },
      end: { x: x + width / 2, y: baseline },
    }),
    [baseline, targetHeight, width, x],
  );

  useEffect(() => {
    progress.value = reduceMotion
      ? 1
      : withDelay(index * BAR_CHART.growStaggerMs, withSpring(1, springs.soft));

    return () => cancelAnimation(progress);
  }, [index, progress, reduceMotion]);

  const path = useDerivedValue(() => {
    const height = targetHeight * progress.value;
    const top = baseline - height;
    const radius = Math.min(BAR_CHART.cornerRadius, width / 2, height / 2);
    const builder = Skia.PathBuilder.Make()
      .moveTo(x, baseline)
      .lineTo(x, top + radius)
      .quadTo(x, top, x + radius, top)
      .lineTo(x + width - radius, top)
      .quadTo(x + width, top, x + width, top + radius)
      .lineTo(x + width, baseline)
      .close();

    return builder.build();
  });

  return (
    <Group opacity={isTallest ? 1 : BAR_CHART.nonTallestOpacity}>
      <Path path={path}>
        <LinearGradient {...gradientPoints} colors={[accentAlt, accent]} />
      </Path>
    </Group>
  );
}
