import { BarModeControl, type BarMode } from "@/components/BarModeControl";
import { BarShape } from "@/components/BarShape";
import { BarTooltip } from "@/components/BarTooltip";
import { BAR_CHART } from "@/constants/stats";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import {
  getBarHitArea,
  getBarWidth,
  getNiceMax,
  hitTestBar,
} from "@/lib/chartGeometry";
import { localDateKey } from "@/lib/dates";
import { selection } from "@/lib/haptics";
import { formatMoney } from "@/lib/money";
import type { DaySpend, WeekSpend } from "@/lib/stats";
import { durations } from "@/theme/motion";
import { useTheme } from "@/theme/ThemeProvider";
import {
  fontFamily,
  layout,
  radii,
  spacing,
  tabularNums,
  typography,
} from "@/theme/tokens";
import {
  Canvas,
  Line,
  RoundedRect,
} from "@shopify/react-native-skia";
import { format } from "date-fns";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

interface BarChartProps {
  weekData: readonly WeekSpend[];
  dayData: readonly DaySpend[];
  isCurrentMonth: boolean;
}

interface BarDatum {
  key: string;
  label: string;
  amountCents: number;
  isToday: boolean;
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
  },
  control: {
    marginBottom: spacing.base,
  },
  chartRow: {
    flexDirection: "row",
    width: "100%",
  },
  axis: {
    width: BAR_CHART.axisLabelWidth,
    height: BAR_CHART.height,
    position: "relative",
  },
  axisLabel: {
    ...typography.caption,
    ...tabularNums,
    position: "absolute",
    right: spacing.sm,
  },
  scroll: {
    flexGrow: 0,
  },
  content: {
    height: BAR_CHART.height,
    position: "relative",
  },
  canvas: {
    width: "100%",
    height: BAR_CHART.height,
  },
  labels: {
    position: "absolute",
    left: 0,
    bottom: 0,
    height: BAR_CHART.bottomPadding,
    flexDirection: "row",
  },
  labelSlot: {
    height: BAR_CHART.bottomPadding,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    ...typography.caption,
    ...tabularNums,
  },
  todayLabel: {
    fontFamily: fontFamily.bold,
  },
});

function formatAxisLabel(cents: number): string {
  return formatMoney(cents, { compact: true }).replace(/\.00$/, "");
}

function dayBarLabel(date: string): string {
  return format(new Date(`${date}T12:00:00`), "MMM d");
}

export function BarChart({
  weekData,
  dayData,
  isCurrentMonth,
}: BarChartProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotionSafe();
  const [mode, setMode] = useState<BarMode>("week");
  const [width, setWidth] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const todayKey = useMemo(() => localDateKey(new Date()), []);
  const weekBars = useMemo<BarDatum[]>(
    () =>
      weekData.map((week) => ({
        key: `week-${week.bucket}`,
        label: `Week ${week.bucket + 1}`,
        amountCents: week.amountCents,
        isToday: false,
      })),
    [weekData],
  );
  const dayBars = useMemo<BarDatum[]>(
    () =>
      dayData.map((day) => ({
        key: day.date,
        label: dayBarLabel(day.date),
        amountCents: day.amountCents,
        isToday: isCurrentMonth && day.date === todayKey,
      })),
    [dayData, isCurrentMonth, todayKey],
  );
  const bars = mode === "week" ? weekBars : dayBars;
  const maxAmount = useMemo(
    () => Math.max(0, ...bars.map((bar) => bar.amountCents)),
    [bars],
  );
  const axisMaxCents = useMemo(
    () =>
      getNiceMax(maxAmount, BAR_CHART.gridLineCount) || BAR_CHART.zeroMaxCents,
    [maxAmount],
  );
  const plotHeight =
    BAR_CHART.height - BAR_CHART.topPadding - BAR_CHART.bottomPadding;
  const baseline = BAR_CHART.topPadding + plotHeight;
  const availableWidth = Math.max(
    0,
    width - BAR_CHART.axisLabelWidth - BAR_CHART.rightPadding,
  );
  const slotWidth =
    mode === "week"
      ? availableWidth / Math.max(1, bars.length)
      : BAR_CHART.daySlotWidth;
  const plotWidth = slotWidth * bars.length;
  const contentWidth =
    mode === "week"
      ? availableWidth
      : Math.max(availableWidth, plotWidth + BAR_CHART.rightPadding);
  const canvasWidth = Math.max(1, contentWidth);
  const barWidth = getBarWidth(slotWidth);
  const hitArea = useMemo(
    () =>
      getBarHitArea(
        0,
        plotWidth,
        BAR_CHART.topPadding,
        baseline,
        bars.length,
      ),
    [bars.length, baseline, plotWidth],
  );
  const gridValues = useMemo(
    () => [axisMaxCents, axisMaxCents / 2, 0],
    [axisMaxCents],
  );
  const selectedBar =
    selectedIndex === null ? undefined : bars[selectedIndex];
  const modeEntrance = reduceMotion
    ? FadeIn.duration(durations.reduced)
    : FadeIn.duration(durations.base);
  const modeExit = reduceMotion
    ? FadeOut.duration(durations.reduced)
    : FadeOut.duration(durations.fast);

  useEffect(() => {
    setSelectedIndex(null);
  }, [mode]);

  useEffect(() => {
    if (selectedIndex !== null && selectedIndex >= bars.length) {
      setSelectedIndex(null);
    }
  }, [bars.length, selectedIndex]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  }, []);
  const handleModeChange = useCallback((nextMode: BarMode) => {
    setSelectedIndex(null);
    setMode(nextMode);
  }, []);
  const handleOutsideTouch = useCallback(() => {
    setSelectedIndex(null);
  }, []);
  const handleTouch = useCallback(
    (event: GestureResponderEvent) => {
      const index = hitTestBar(
        { x: event.nativeEvent.locationX, y: event.nativeEvent.locationY },
        bars.length,
        hitArea,
      );

      if (index === null) {
        setSelectedIndex(null);
      } else {
        void selection();
        setSelectedIndex(index);
      }
      event.stopPropagation();
    },
    [bars.length, hitArea],
  );
  const axisLabelStyle = useMemo(
    () => [styles.axisLabel, { color: colors.textMuted }],
    [colors.textMuted],
  );
  const labelStyle = useMemo(
    () => [styles.label, { color: colors.textMuted }],
    [colors.textMuted],
  );
  const todayLabelStyle = useMemo(
    () => [styles.label, styles.todayLabel, { color: colors.accent }],
    [colors.accent],
  );

  const tooltipLeft = selectedBar
    ? Math.max(
        0,
        Math.min(
          (selectedIndex ?? 0) * slotWidth +
            slotWidth / 2 -
            BAR_CHART.tooltipWidth / 2,
          contentWidth - BAR_CHART.tooltipWidth,
        ),
      )
    : 0;
  const selectedBarTop = selectedBar
    ? baseline - (selectedBar.amountCents / axisMaxCents) * plotHeight
    : baseline;
  const tooltipTop = Math.max(
    BAR_CHART.tooltipGap,
    selectedBarTop - BAR_CHART.tooltipHeight - BAR_CHART.tooltipGap,
  );

  return (
    <View
      testID="bar-chart-root"
      style={styles.root}
      onLayout={handleLayout}
      onTouchStart={handleOutsideTouch}
    >
      <View style={styles.control}>
        <BarModeControl mode={mode} onChange={handleModeChange} />
      </View>
      <View style={styles.chartRow}>
        <View style={styles.axis} pointerEvents="none">
          {gridValues.map((value) => {
            const top =
              BAR_CHART.topPadding +
              (1 - value / axisMaxCents) * plotHeight -
              typography.caption.lineHeight / 2;
            return (
              <Text
                key={value}
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[axisLabelStyle, { top }]}
              >
                {formatAxisLabel(value)}
              </Text>
            );
          })}
        </View>
        <Animated.View
          key={mode}
          entering={modeEntrance}
          exiting={modeExit}
          style={styles.scroll}
        >
          <ScrollView
            horizontal
            scrollEnabled={mode === "day"}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ width: canvasWidth }}
          >
            <View style={[styles.content, { width: canvasWidth }]}>
              <Canvas
                testID="bar-canvas"
                style={styles.canvas}
                onTouchStart={handleTouch}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                {gridValues.map((value) => {
                  const y =
                    BAR_CHART.topPadding +
                    (1 - value / axisMaxCents) * plotHeight;
                  return (
                    <Line
                      key={value}
                      p1={{ x: 0, y }}
                      p2={{ x: plotWidth, y }}
                      color={colors.border}
                      strokeWidth={layout.borderWidth}
                    />
                  );
                })}
                {bars.map((bar, index) =>
                  bar.isToday ? (
                    <RoundedRect
                      key={`today-${bar.key}`}
                      x={index * slotWidth}
                      y={BAR_CHART.topPadding}
                      width={slotWidth}
                      height={plotHeight}
                      r={radii.input}
                      color={colors.accent}
                      opacity={BAR_CHART.todayHighlightOpacity}
                    />
                  ) : null,
                )}
                {bars.map((bar, index) => (
                  <BarShape
                    key={bar.key}
                    x={index * slotWidth + (slotWidth - barWidth) / 2}
                    baseline={baseline}
                    width={barWidth}
                    amountCents={bar.amountCents}
                    axisMaxCents={axisMaxCents}
                    plotHeight={plotHeight}
                    index={index}
                    isTallest={maxAmount > 0 && bar.amountCents === maxAmount}
                    accent={colors.accent}
                    accentAlt={colors.accentAlt}
                  />
                ))}
              </Canvas>
              <View style={[styles.labels, { width: canvasWidth }]} pointerEvents="none">
                {bars.map((bar, index) => (
                  <View
                    key={bar.key}
                    style={[styles.labelSlot, { width: slotWidth }]}
                  >
                    <Text
                      testID={`bar-label-${bar.key}`}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={bar.isToday ? todayLabelStyle : labelStyle}
                    >
                      {mode === "week" ? `W${index + 1}` : String(index + 1)}
                    </Text>
                  </View>
                ))}
              </View>
              {selectedBar ? (
                <BarTooltip
                  key={selectedBar.key}
                  left={tooltipLeft}
                  top={tooltipTop}
                  amountCents={selectedBar.amountCents}
                  label={selectedBar.label}
                />
              ) : null}
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </View>
  );
}
