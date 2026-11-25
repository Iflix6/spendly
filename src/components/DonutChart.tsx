import { DonutLegendRow } from "@/components/DonutLegendRow";
import { DonutSlice } from "@/components/DonutSlice";
import { PERCENT_PRECISION } from "@/constants";
import {
    CATEGORY_BY_ID,
    CATEGORY_IDS,
    type CategoryId,
} from "@/constants/categories";
import { AMOUNT_INPUT } from "@/constants/expenseForm";
import { DONUT_CHART } from "@/constants/stats";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { getDonutSlices, hitTestDonut } from "@/lib/chartGeometry";
import { selection } from "@/lib/haptics";
import { formatMoney } from "@/lib/money";
import { durations } from "@/theme/motion";
import { useTheme } from "@/theme/ThemeProvider";
import { fontFamily, spacing, tabularNums, typography } from "@/theme/tokens";
import { Canvas } from "@shopify/react-native-skia";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    StyleSheet,
    Text,
    View,
    type GestureResponderEvent,
    type LayoutChangeEvent,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

export interface DonutDatum {
  categoryId: CategoryId;
  amountCents: number;
}

interface DonutChartProps {
  data: readonly DonutDatum[];
  totalCents: number;
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    alignItems: "center",
  },
  measure: {
    width: "100%",
    alignItems: "center",
  },
  chart: {
    position: "relative",
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: DONUT_CHART.strokeWidth,
  },
  centerTitle: {
    ...typography.body,
    fontFamily: fontFamily.semibold,
    textAlign: "center",
  },
  centerAmount: {
    ...typography.headline,
    ...tabularNums,
    fontFamily: fontFamily.bold,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  centerPercent: {
    ...typography.caption,
    ...tabularNums,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  legend: {
    width: "100%",
    marginTop: spacing.base,
    gap: spacing.xs,
  },
});

function isCategoryId(value: string | null): value is CategoryId {
  return value !== null && CATEGORY_IDS.includes(value as CategoryId);
}

export function DonutChart({ data, totalCents }: DonutChartProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotionSafe();
  const [width, setWidth] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<CategoryId | null>(null);
  const chartSize =
    width > 0
      ? Math.min(DONUT_CHART.maxSize, Math.max(DONUT_CHART.minSize, width))
      : DONUT_CHART.defaultSize;
  const center = chartSize / 2;
  const radius =
    (chartSize - DONUT_CHART.strokeWidth) / 2 - DONUT_CHART.selectedOffset;
  const innerRadius = radius - DONUT_CHART.strokeWidth;
  const capHalfAngleDegrees =
    (DONUT_CHART.strokeWidth / 2 / Math.max(1, radius)) * (180 / Math.PI);
  const sliceGapDegrees = Math.max(
    DONUT_CHART.gapAngleDegrees,
    capHalfAngleDegrees * 2 + DONUT_CHART.gapAngleDegrees,
  );
  const slices = useMemo(
    () =>
      getDonutSlices(
        data.map((datum) => ({
          key: datum.categoryId,
          value: datum.amountCents,
        })),
        sliceGapDegrees,
      ),
    [data, sliceGapDegrees],
  );
  const selectedDatum =
    selectedCategoryId === null
      ? undefined
      : data.find((datum) => datum.categoryId === selectedCategoryId);
  const selectedPercent =
    selectedDatum && totalCents > 0
      ? (selectedDatum.amountCents / totalCents) * 100
      : 0;
  const centerTitle = selectedDatum
    ? CATEGORY_BY_ID[selectedDatum.categoryId].label
    : "Total";
  const centerAmount = selectedDatum?.amountCents ?? totalCents;
  const canvasStyle = useMemo(
    () => ({ width: chartSize, height: chartSize }),
    [chartSize],
  );
  const chartEntrance = reduceMotion
    ? FadeIn.duration(durations.reduced)
    : undefined;

  useEffect(() => {
    if (
      selectedCategoryId !== null &&
      !data.some((datum) => datum.categoryId === selectedCategoryId)
    ) {
      setSelectedCategoryId(null);
    }
  }, [data, selectedCategoryId]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  }, []);
  const handleSelect = useCallback(
    (categoryId: CategoryId | null) => {
      const next = selectedCategoryId === categoryId ? null : categoryId;
      setSelectedCategoryId(next);
      if (next !== null) {
        void selection();
      }
    },
    [selectedCategoryId],
  );
  const handleOutsideTouch = useCallback(() => {
    setSelectedCategoryId(null);
  }, []);
  const handleTouch = useCallback(
    (event: GestureResponderEvent) => {
      const { locationX, locationY } = event.nativeEvent;
      const key = hitTestDonut(
        { x: locationX, y: locationY },
        { x: center, y: center },
        innerRadius,
        radius + DONUT_CHART.selectedOffset,
        slices,
      );
      handleSelect(isCategoryId(key) ? key : null);
      event.stopPropagation();
    },
    [center, handleSelect, innerRadius, radius, slices],
  );
  const centerTitleStyle = useMemo(
    () => [styles.centerTitle, { color: colors.textMuted }],
    [colors.textMuted],
  );
  const centerAmountStyle = useMemo(
    () => [styles.centerAmount, { color: colors.text }],
    [colors.text],
  );
  const centerPercentStyle = useMemo(
    () => [styles.centerPercent, { color: colors.textMuted }],
    [colors.textMuted],
  );

  return (
    <View
      testID="donut-chart-root"
      style={styles.root}
      onTouchStart={handleOutsideTouch}
    >
      <View style={styles.measure} onLayout={handleLayout}>
        <Animated.View
          entering={chartEntrance}
          style={[styles.chart, canvasStyle]}
        >
          <Canvas
            style={canvasStyle}
            onTouchStart={handleTouch}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {slices.map((slice, index) => (
              <DonutSlice
                key={slice.key}
                geometry={slice}
                color={CATEGORY_BY_ID[slice.key as CategoryId].color}
                center={center}
                radius={radius}
                index={index}
                sliceCount={slices.length}
                selected={selectedCategoryId === slice.key}
                hasSelection={selectedCategoryId !== null}
              />
            ))}
          </Canvas>
          <View style={styles.center} pointerEvents="none">
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={centerTitleStyle}
            >
              {centerTitle}
            </Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={AMOUNT_INPUT.minimumFontScale}
              style={centerAmountStyle}
            >
              {formatMoney(centerAmount)}
            </Text>
            {selectedDatum ? (
              <Text numberOfLines={1} style={centerPercentStyle}>
                {selectedPercent.toFixed(PERCENT_PRECISION)}% of total
              </Text>
            ) : null}
          </View>
        </Animated.View>
      </View>
      <View style={styles.legend}>
        {data.map((datum, index) => (
          <DonutLegendRow
            key={datum.categoryId}
            categoryId={datum.categoryId}
            amountCents={datum.amountCents}
            percent={
              totalCents > 0 ? (datum.amountCents / totalCents) * 100 : 0
            }
            selected={selectedCategoryId === datum.categoryId}
            index={index}
            onPress={() => handleSelect(datum.categoryId)}
          />
        ))}
      </View>
    </View>
  );
}
