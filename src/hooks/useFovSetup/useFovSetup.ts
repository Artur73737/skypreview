import { useMemo } from "react";
import { computeFov } from "../../services/fov";

export function useFovSetup(
  focalMm: number,
  apertureMm: number,
  barlow: number,
  resXpx: number,
  resYpx: number,
  pixelUm: number,
) {
  return useMemo(
    () => computeFov(focalMm, apertureMm, barlow, resXpx, resYpx, pixelUm),
    [focalMm, apertureMm, barlow, resXpx, resYpx, pixelUm],
  );
}
