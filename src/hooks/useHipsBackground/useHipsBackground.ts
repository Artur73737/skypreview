import { useEffect, useState } from "react";
import { getHipsCutoutUrl, loadHipsImage } from "../../services/hips";

export interface HipsBackground {
  img: HTMLImageElement | null;
  loading: boolean;
  error: string | null;
  raDeg: number;
  decDeg: number;
  fovDeg: number;
}

function stepsForFov(fovDeg: number, hd: boolean): number[] {
  if (!hd) return [384];
  if (fovDeg > 40) return [384];
  if (fovDeg > 12) return [384, 768];
  return [384, 1024];
}

export function useHipsBackground(
  enabled: boolean,
  raDeg: number,
  decDeg: number,
  fovDeg: number,
  hd = true,
) {
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState<HipsBackground>({
    img: null,
    loading: false,
    error: null,
    raDeg,
    decDeg,
    fovDeg,
  });
  useEffect(() => {
    if (!enabled) {
      setState((s) => ({ ...s, img: null, loading: false, error: null }));
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const steps = stepsForFov(fovDeg, hd);
        for (const resolution of steps) {
          const cutout = getHipsCutoutUrl(raDeg, decDeg, fovDeg, resolution);
          const img = await loadHipsImage(cutout, controller.signal);
          if (controller.signal.aborted) return;
          setState({
            img,
            loading: resolution !== steps[steps.length - 1],
            error: null,
            raDeg,
            decDeg,
            fovDeg: cutout.fovDeg,
          });
        }
      } catch {
        if (!controller.signal.aborted) {
          setState((s) => ({
            ...s,
            loading: false,
            error: "Dettaglio DSS2 non disponibile. La mappa di base resta visibile.",
          }));
        }
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [enabled, raDeg, decDeg, fovDeg, hd, retry]);
  return { ...state, retry: () => setRetry((n) => n + 1) };
}
