const HIPS_BASE = "https://alasky.cds.unistra.fr/hips-image-services/hips2fits";

export interface HipsCutout {
  key: string;
  url: string;
  raDeg: number;
  decDeg: number;
  fovDeg: number;
}

export function getHipsCutoutUrl(
  raDeg: number,
  decDeg: number,
  fovDeg: number,
  sizePx = 1024,
): HipsCutout {
  const fov = Math.max(0.15, Math.min(170, fovDeg));
  const ra = ((raDeg % 360) + 360) % 360;
  const scale = 2 * Math.tan(fov * Math.PI / 360) * 180 / Math.PI / sizePx;
  const params = new URLSearchParams({
    wcs: JSON.stringify({ NAXIS: 2, NAXIS1: sizePx, NAXIS2: sizePx, CTYPE1: "RA---TAN", CTYPE2: "DEC--TAN", CRVAL1: ra, CRVAL2: decDeg, CRPIX1: (sizePx + 1) / 2, CRPIX2: (sizePx + 1) / 2, CDELT1: -scale, CDELT2: scale, CUNIT1: "deg", CUNIT2: "deg" }),
    hips: "CDS/P/DSS2/color",
    ra: ra.toFixed(4),
    dec: decDeg.toFixed(4),
    fov: fov.toFixed(3),
    width: String(sizePx),
    height: String(sizePx),
    projection: "TAN",
    coordsys: "icrs",
    format: "png",
    stretch: "asinh",
    min_cut: "0.5%",
    max_cut: "99.5%",
  });
  const key = `${ra.toFixed(5)}|${decDeg.toFixed(5)}|${fov.toFixed(5)}|${sizePx}`;
  return { key, url: `${HIPS_BASE}?${params.toString()}`, raDeg: ra, decDeg, fovDeg: fov };
}

const imageCache = new Map<string, HTMLImageElement>();

export async function loadHipsImage(cutout: HipsCutout, signal?: AbortSignal): Promise<HTMLImageElement> {
  const cached = imageCache.get(cutout.key);
  if (cached) return cached;
  let lastError: unknown;
  for (const host of ["alasky.cds.unistra.fr", "alaskybis.cds.unistra.fr"]) {
    try {
      const response = await fetch(cutout.url.replace("alasky.cds.unistra.fr", host), {
        signal: AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(25000)]),
      });
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
      } finally { URL.revokeObjectURL(url); }
    } catch (error) {
      if (signal?.aborted) throw error;
      lastError = error;
    }
  }
  throw lastError;
}
