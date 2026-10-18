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

function resolutionForView(hd: boolean): number {
  // Never expose an intermediate low-resolution image. A view is either empty/loading or final.
  return hd ? 4096 : 1024;
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
        const resolution = resolutionForView(hd);
        const cutout = getHipsCutoutUrl(raDeg, decDeg, fovDeg, resolution);
        const img = await loadHipsImage(cutout, controller.signal);
        if (controller.signal.aborted) return;
        setState({ img, loading: false, error: null, raDeg, decDeg, fovDeg: cutout.fovDeg });
      } catch {
        if (!controller.signal.aborted) {
          setState((s) => ({
            ...s,
            loading: false,
            error: "Texture DSS2 non disponibile per questa vista. Riprova per caricarla in alta risoluzione.",
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
