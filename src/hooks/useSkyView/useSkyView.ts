import { useMemo } from "react";
import { normalizeDeg360 } from "../../services/astroMath";

export interface SkyProjection {
  raDecToXy: (raHours: number, decDeg: number, width: number, height: number) => {
    x: number;
    y: number;
    visible: boolean;
  };
  xyToRaDec: (x: number, y: number, width: number, height: number) => {
    raHours: number;
    decDeg: number;
  };
  viewHeightDeg: number;
}

export function useSkyView(
  centerRaHours: number,
  centerDecDeg: number,
  viewWidthDeg: number,
): SkyProjection {
  return useMemo(() => {
    const centerDecRad = (centerDecDeg * Math.PI) / 180;
    const cosC = Math.max(0.2, Math.cos(centerDecRad));
    const raDecToXy = (raHours: number, decDeg: number, width: number, height: number) => {
      const viewHeightDeg = viewWidthDeg * (height / Math.max(1, width));
      let dRaDeg = (raHours - centerRaHours) * 15;
      dRaDeg = normalizeDeg360(dRaDeg + 180) - 180;
      const xDeg = dRaDeg * cosC;
      const yDeg = decDeg - centerDecDeg;
      const scale = width / viewWidthDeg;
      return {
        x: width / 2 + xDeg * scale,
        y: height / 2 - yDeg * scale,
        visible:
          Math.abs(xDeg) < viewWidthDeg * 0.75 && Math.abs(yDeg) < viewHeightDeg * 0.75,
      };
    };
    const xyToRaDec = (x: number, y: number, width: number, height: number) => {
      const scale = width / viewWidthDeg;
      const xDeg = (x - width / 2) / scale;
      const yDeg = (height / 2 - y) / scale;
      const dRaDeg = xDeg / cosC;
      const raHours = (((centerRaHours + dRaDeg / 15) % 24) + 24) % 24;
      return { raHours, decDeg: centerDecDeg + yDeg };
    };
    return {
      raDecToXy,
      xyToRaDec,
      viewHeightDeg: viewWidthDeg * 0.66,
    };
  }, [centerRaHours, centerDecDeg, viewWidthDeg]);
}
