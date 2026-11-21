import { useMemo } from "react";
import { computeSolarSystem } from "../../services/solarSystem";

export function useSolarSystem(
  latDeg: number,
  lonDegEast: number,
  dateIso: string,
) {
  return useMemo(
    () => computeSolarSystem(new Date(dateIso), latDeg, lonDegEast),
    [latDeg, lonDegEast, dateIso],
  );
}
