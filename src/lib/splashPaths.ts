import {
    SPLASH_MARK_GEOMETRY,
    type SplashPathCommand,
} from "@/constants/splash";

export type { SplashPathCommand } from "@/constants/splash";

export type SplashMarkPaths = Record<
  "body" | "slot" | "detail",
  SplashPathCommand[]
>;

function scaleCommand(
  command: SplashPathCommand,
  size: number,
): SplashPathCommand {
  switch (command.kind) {
    case "moveTo":
    case "lineTo":
      return {
        kind: command.kind,
        x: command.x * size,
        y: command.y * size,
      };
    case "quadTo":
      return {
        kind: command.kind,
        controlX: command.controlX * size,
        controlY: command.controlY * size,
        x: command.x * size,
        y: command.y * size,
      };
    case "close":
      return { kind: command.kind };
  }
}

export function createSplashMarkPaths(size: number): SplashMarkPaths {
  if (!Number.isFinite(size) || size <= 0) {
    throw new Error("Splash mark size must be a positive finite number.");
  }

  return {
    body: SPLASH_MARK_GEOMETRY.body.map((command) =>
      scaleCommand(command, size),
    ),
    slot: SPLASH_MARK_GEOMETRY.slot.map((command) =>
      scaleCommand(command, size),
    ),
    detail: SPLASH_MARK_GEOMETRY.detail.map((command) =>
      scaleCommand(command, size),
    ),
  };
}
