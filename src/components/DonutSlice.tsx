import { DONUT_CHART } from "@/constants/stats";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import type { DonutSliceGeometry } from "@/lib/chartGeometry";
import { durations, easing, springs } from "@/theme/motion";
import { Group, Path, Skia } from "@shopify/react-native-skia";
import { useEffect, useMemo } from "react";
import {
  cancelAnimation,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

interface DonutSliceProps {
  geometry: DonutSliceGeometry;
  color: string;
  center: number;
  radius: number;
  index: number;
  sliceCount: number;
  selected: boolean;
  hasSelection: boolean;
}

export function DonutSlice({
  geometry,
  color,
  center,
  radius,
  index,
  sliceCount,
  selected,
  hasSelection,
}: DonutSliceProps) {
  const reduceMotion = useReducedMotionSafe();
  const progress = useSharedValue(0);
  const offset = useSharedValue(0);
  const oval = useMemo(
    () => ({
      x: center - radius,
      y: center - radius,
      width: radius * 2,
      height: radius * 2,
    }),
    [center, radius],
  );
  const path = useMemo(
    () =>
      Skia.PathBuilder.Make()
        .addArc(oval, geometry.startAngle, geometry.sweepAngle)
        .build(),
    [geometry.startAngle, geometry.sweepAngle, oval],
  );

  useEffect(() => {
    const sliceDuration = durations.chart / Math.max(1, sliceCount);
    progress.value = reduceMotion
      ? 1
      : withDelay(
          index * sliceDuration,
          withTiming(1, {
            duration: sliceDuration,
            easing: easing.entrance,
          }),
        );

    return () => cancelAnimation(progress);
  }, [index, progress, reduceMotion, sliceCount]);

  useEffect(() => {
    offset.value = reduceMotion
      ? selected
        ? DONUT_CHART.selectedOffset
        : 0
      : withSpring(selected ? DONUT_CHART.selectedOffset : 0, springs.snappy);

    return () => cancelAnimation(offset);
  }, [offset, reduceMotion, selected]);

  const transform = useDerivedValue(() => {
    const radians = (geometry.midAngle * Math.PI) / 180;
    return [
      { translateX: Math.cos(radians) * offset.value },
      { translateY: Math.sin(radians) * offset.value },
    ];
  });

  return (
    <Group
      opacity={hasSelection && !selected ? DONUT_CHART.dimmedOpacity : 1}
      transform={transform}
    >
      <Path
        path={path}
        start={0}
        end={progress}
        color={color}
        strokeWidth={DONUT_CHART.strokeWidth}
        strokeCap="round"
        style="stroke"
      />
    </Group>
  );
}
