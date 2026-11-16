export interface HipsCutout {
  key: string;
  raDeg: number;
  decDeg: number;
  fovDeg: number;
  sizePx: number;
}

export interface HipsPackImage extends HipsCutout {
  url: string;
}

/** Describes a square north-up/east-left TAN texture for a sky position. */
export function getHipsCutout(
  raDeg: number,
  decDeg: number,
  fovDeg: number,
  sizePx = 1024,
): HipsCutout {
  const fov = Math.max(0.15, Math.min(170, fovDeg));
  const ra = ((raDeg % 360) + 360) % 360;
  const key = `${ra.toFixed(5)}|${decDeg.toFixed(5)}|${fov.toFixed(5)}|${sizePx}`;
  return { key, raDeg: ra, decDeg, fovDeg: fov, sizePx };
}

const imageCache = new Map<string, HTMLImageElement>();

function timeoutSignal(signal: AbortSignal | undefined): AbortSignal {
  const timeout = AbortSignal.timeout(20000);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

/** Loads a cutout already present in the local sky pack. */
export async function loadHipsImage(
  cutout: HipsPackImage,
  signal?: AbortSignal,
): Promise<HTMLImageElement> {
  const cached = imageCache.get(cutout.key);
  if (cached) return cached;

  const response = await fetch(cutout.url, { signal: timeoutSignal(signal) });
  if (!response.ok) throw new Error(`DSS2: HTTP ${response.status}`);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    if (imageCache.size >= 12) imageCache.delete(imageCache.keys().next().value!);
    imageCache.set(cutout.key, img);
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}
