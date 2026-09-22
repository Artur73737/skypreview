export interface FovResult {
  widthDeg: number;
  heightDeg: number;
  diagonalDeg: number;
  samplingArcsecPx: number;
  focalRatio: number;
  effectiveFocalMm: number;
}

export function effectiveFocalLength(focalMm: number, barlow: number): number {
  return focalMm * barlow;
}

export function sensorSizeMm(resPx: number, pixelUm: number): number {
  return (resPx * pixelUm) / 1000;
}

export function computeFov(
  focalMm: number,
  apertureMm: number,
  barlow: number,
  resXpx: number,
  resYpx: number,
  pixelUm: number,
): FovResult {
  const eff = effectiveFocalLength(focalMm, barlow);
  const wMm = sensorSizeMm(resXpx, pixelUm);
  const hMm = sensorSizeMm(resYpx, pixelUm);
  const widthDeg = (2 * Math.atan(wMm / (2 * eff)) * 180) / Math.PI;
  const heightDeg = (2 * Math.atan(hMm / (2 * eff)) * 180) / Math.PI;
  const diagonalDeg = (2 * Math.atan(Math.hypot(wMm, hMm) / (2 * eff)) * 180) / Math.PI;
  const samplingArcsecPx = (206.265 * pixelUm) / eff;
  const focalRatio = apertureMm > 0 ? eff / apertureMm : 0;
  return {
    widthDeg,
    heightDeg,
    diagonalDeg,
    samplingArcsecPx,
    focalRatio,
    effectiveFocalMm: eff,
  };
}
