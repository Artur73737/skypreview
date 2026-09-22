import { useMemo } from "react";
import { localSiderealHours } from "../../services/astroMath";

export function useObserver(latDeg: number, lonDegEast: number, dateIso: string) {
  return useMemo(() => {
    const date = new Date(dateIso);
    return { date, lstHours: localSiderealHours(date, lonDegEast), latDeg, lonDegEast };
  }, [latDeg, lonDegEast, dateIso]);
}
