import { BAR_CHART, DONUT_CHART } from "@/constants/stats";

const { fullCircleDegrees, startAngleDegrees } = DONUT_CHART;
const { niceSteps } = BAR_CHART;

export interface DonutValue {
  key: string;
  value: number;
}

export interface DonutSliceGeometry {
  key: string;
  value: number;
  ratio: number;
  startAngle: number;
  endAngle: number;
  sweepAngle: number;
  midAngle: number;
}

export interface ChartPoint {
  x: number;
  y: number;
}

export interface BarHitArea {
  left: number;
  right: number;
  top: number;
  bottom: number;
  slotWidth: number;
}

function safePositiveValue(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function getDonutSlices(
  values: readonly DonutValue[],
  gapAngleDegrees: number = DONUT_CHART.gapAngleDegrees,
  minVisibleAngleDegrees: number = DONUT_CHART.minVisibleAngleDegrees,
): DonutSliceGeometry[] {
  const positiveValues = values
    .map((item) => ({ key: item.key, value: safePositiveValue(item.value) }))
    .filter((item) => item.value > 0);
  const total = positiveValues.reduce((sum, item) => sum + item.value, 0);

  if (positiveValues.length === 0 || total <= 0) {
    return [];
  }

  if (positiveValues.length === 1) {
    const item = positiveValues[0];
    return [
      {
        ...item,
        ratio: 1,
        startAngle: startAngleDegrees,
        endAngle: startAngleDegrees + fullCircleDegrees,
        sweepAngle: fullCircleDegrees,
        midAngle: startAngleDegrees + fullCircleDegrees / 2,
      },
    ];
  }

  const count = positiveValues.length;
  const safeGap = Math.min(
    Math.max(0, gapAngleDegrees),
    fullCircleDegrees / (count * 2),
  );
  const availableAngle = fullCircleDegrees - safeGap * (count - 1);
  const minimumAngle = Math.min(
    Math.max(0, minVisibleAngleDegrees),
    availableAngle / count,
  );
  const clamped = positiveValues.map(
    (item) => (item.value / total) * availableAngle < minimumAngle,
  );
  const clampedTotal = positiveValues.reduce(
    (sum, item, index) => sum + (clamped[index] ? minimumAngle : 0),
    0,
  );
  const adjustableTotal = positiveValues.reduce(
    (sum, item, index) => sum + (clamped[index] ? 0 : item.value),
    0,
  );
  const adjustableAngle = availableAngle - clampedTotal;

  let cursor = startAngleDegrees;
  return positiveValues.map((item, index) => {
    const sweepAngle = clamped[index]
      ? minimumAngle
      : adjustableTotal > 0
        ? (item.value / adjustableTotal) * adjustableAngle
        : availableAngle / count;
    const startAngle = cursor;
    const endAngle = startAngle + sweepAngle;
    cursor = endAngle + safeGap;

    return {
      ...item,
      ratio: item.value / total,
      startAngle,
      endAngle,
      sweepAngle,
      midAngle: startAngle + sweepAngle / 2,
    };
  });
}

export function hitTestDonut(
  point: ChartPoint,
  center: ChartPoint,
  innerRadius: number,
  outerRadius: number,
  slices: readonly DonutSliceGeometry[],
): string | null {
  const deltaX = point.x - center.x;
  const deltaY = point.y - center.y;
  const distance = Math.hypot(deltaX, deltaY);

  if (
    !Number.isFinite(distance) ||
    distance < Math.max(0, innerRadius) ||
    distance > Math.max(0, outerRadius)
  ) {
    return null;
  }

  const absoluteAngle = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;
  const relativeAngle =
    (absoluteAngle - startAngleDegrees + fullCircleDegrees) % fullCircleDegrees;

  for (const slice of slices) {
    const start =
      (slice.startAngle - startAngleDegrees + fullCircleDegrees) %
      fullCircleDegrees;
    const end = start + slice.sweepAngle;

    if (relativeAngle >= start && relativeAngle < end) {
      return slice.key;
    }
  }

  return null;
}

export function getNiceMax(
  value: number,
  tickCount: number = BAR_CHART.gridLineCount,
): number {
  const safeValue = safePositiveValue(value);
  const requestedTickCount = Number.isFinite(tickCount)
    ? Math.round(tickCount)
    : BAR_CHART.gridLineCount;
  const safeTickCount = Math.max(1, requestedTickCount);

  if (safeValue === 0) {
    return 0;
  }

  const roughStep = safeValue / safeTickCount;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalizedStep = roughStep / magnitude;
  const niceStep =
    niceSteps.find((step) => normalizedStep <= step) ??
    niceSteps[niceSteps.length - 1];

  return Math.ceil(niceStep * magnitude * safeTickCount);
}

export function getBarHitArea(
  left: number,
  right: number,
  top: number,
  bottom: number,
  count: number,
): BarHitArea {
  const safeCount = Math.max(1, count);
  const safeRight = Math.max(left, right);
  const safeBottom = Math.max(top, bottom);

  return {
    left,
    right: safeRight,
    top,
    bottom: safeBottom,
    slotWidth: (safeRight - left) / safeCount,
  };
}

export function hitTestBar(
  point: ChartPoint,
  count: number,
  area: BarHitArea,
): number | null {
  if (
    count <= 0 ||
    point.x < area.left ||
    point.x >= area.right ||
    point.y < area.top ||
    point.y > area.bottom
  ) {
    return null;
  }

  const index = Math.floor((point.x - area.left) / area.slotWidth);
  return index >= 0 && index < count ? index : null;
}

export function getBarWidth(slotWidth: number): number {
  return Math.min(
    BAR_CHART.maxBarWidth,
    Math.max(0, slotWidth * BAR_CHART.barWidthRatio),
  );
}
