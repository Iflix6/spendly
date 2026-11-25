export type SplashPathCommand =
  | { kind: "moveTo"; x: number; y: number }
  | { kind: "lineTo"; x: number; y: number }
  | { kind: "quadTo"; controlX: number; controlY: number; x: number; y: number }
  | { kind: "close" };

export const SPLASH_MARK_GEOMETRY = {
  body: [
    { kind: "moveTo", x: 0.28, y: 0.1 },
    { kind: "lineTo", x: 0.68, y: 0.1 },
    { kind: "quadTo", controlX: 0.8, controlY: 0.1, x: 0.8, y: 0.22 },
    { kind: "lineTo", x: 0.8, y: 0.7 },
    { kind: "lineTo", x: 0.74, y: 0.66 },
    { kind: "lineTo", x: 0.68, y: 0.7 },
    { kind: "lineTo", x: 0.62, y: 0.66 },
    { kind: "lineTo", x: 0.56, y: 0.7 },
    { kind: "lineTo", x: 0.5, y: 0.66 },
    { kind: "lineTo", x: 0.44, y: 0.7 },
    { kind: "lineTo", x: 0.38, y: 0.66 },
    { kind: "lineTo", x: 0.32, y: 0.7 },
    { kind: "lineTo", x: 0.26, y: 0.66 },
    { kind: "lineTo", x: 0.2, y: 0.7 },
    { kind: "lineTo", x: 0.16, y: 0.66 },
    { kind: "lineTo", x: 0.16, y: 0.22 },
    { kind: "quadTo", controlX: 0.16, controlY: 0.1, x: 0.28, y: 0.1 },
    { kind: "close" },
  ],
  slot: [
    { kind: "moveTo", x: 0.36, y: 0.44 },
    { kind: "lineTo", x: 0.64, y: 0.44 },
    { kind: "quadTo", controlX: 0.72, controlY: 0.44, x: 0.72, y: 0.52 },
    { kind: "quadTo", controlX: 0.72, controlY: 0.6, x: 0.64, y: 0.6 },
    { kind: "lineTo", x: 0.36, y: 0.6 },
    { kind: "quadTo", controlX: 0.28, controlY: 0.6, x: 0.28, y: 0.52 },
    { kind: "quadTo", controlX: 0.28, controlY: 0.44, x: 0.36, y: 0.44 },
    { kind: "close" },
  ],
  detail: [
    { kind: "moveTo", x: 0.32, y: 0.26 },
    { kind: "lineTo", x: 0.68, y: 0.26 },
    { kind: "moveTo", x: 0.32, y: 0.34 },
    { kind: "lineTo", x: 0.56, y: 0.34 },
  ],
  coinSlotX: 0.5,
  coinSlotY: 0.52,
} as const;

export const SPLASH_WORDMARK = "Spendly";
export const SPLASH_TAGLINE = "Track every spend";
