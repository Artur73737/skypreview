import { useEffect, useState } from "react";
import {
  findLocalSkyCutout,
  getHipsCutout,
  loadHipsImage,
  loadHipsTexture,
} from "../../services/hips";

export interface HipsBackground {
  img: HTMLImageElement | HTMLCanvasElement | null;
  loading: boolean;
  error: string | null;
  raDeg: number;
  decDeg: number;
  fovDeg: number;
}

export function useHipsBackground(
  enabled: boolean,
  raDeg: number,
  decDeg: number,
  fovDeg: number,
  sizePx = 2048,
  useLocalPack = true,
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
        const requested = getHipsCutout(raDeg, decDeg, fovDeg, sizePx);
        let img: HTMLImageElement | HTMLCanvasElement | null = null;
        let cutout = requested;

        const local = useLocalPack ? await findLocalSkyCutout(requested) : null;
        if (local) {
          try {
            img = await loadHipsImage(local, controller.signal);
            cutout = local;
          } catch {
            if (controller.signal.aborted) return;
          }
        }
        if (!img) img = await loadHipsTexture(requested, controller.signal);
        if (controller.signal.aborted) return;

        setState({
          img,
          loading: false,
          error: null,
          raDeg: cutout.raDeg,
          decDeg: cutout.decDeg,
          fovDeg: cutout.fovDeg,
        });
      } catch {
        if (!controller.signal.aborted) {
          setState((s) => ({
            ...s,
            loading: false,
            error:
              "DSS2 imagery is unavailable for this view.",
          }));
        }
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [enabled, raDeg, decDeg, fovDeg, sizePx, retry, useLocalPack]);
  return { ...state, retry: () => setRetry((n) => n + 1) };
}
