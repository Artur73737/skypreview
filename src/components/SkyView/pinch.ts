export const MIN_FOV_DEG = 0.001;
export const MAX_FOV_DEG = 120;

export function clampFov(fovDeg: number): number {
  return Math.max(MIN_FOV_DEG, Math.min(MAX_FOV_DEG, fovDeg));
}

export function fovForPinch(
  startFovDeg: number,
  startDistancePx: number,
  currentDistancePx: number,
): number {
  if (!Number.isFinite(startDistancePx) || startDistancePx <= 0) return startFovDeg;
  if (!Number.isFinite(currentDistancePx) || currentDistancePx <= 0) return startFovDeg;
  return clampFov(startFovDeg * (startDistancePx / currentDistancePx));
}
