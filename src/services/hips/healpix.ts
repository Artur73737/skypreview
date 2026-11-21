// HEALPix math needed to read HiPS tiles directly in the browser.
// Adapted from the MIT licensed healpix-ts (developmentseed), itself based on
// michitaro/healpix and Gorski et al. 2005. Only the nested-scheme subset used
// by HiPS is kept here so the runtime has no extra dependency.

const PI = Math.PI;
const PI_4 = PI / 4;
const PI_8 = PI / 8;
const DEG = PI / 180;

/** Angular size of one pixel of an order 0 HiPS tile (58.6 deg / 512). */
const ORDER_ZERO_PIXEL_DEG = 58.6 / 512;

export interface HipsTilePosition {
  ipix: number;
  xPx: number;
  yPx: number;
}

export interface SkyPosition {
  raDeg: number;
  decDeg: number;
}

function wrap(value: number, range: number): number {
  const result = value % range;
  return result < 0 ? result + range : result;
}

function clip(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/** Picks the deepest HiPS order that still supersamples the rendered texture. */
export function healpixTileOrder(fovDeg: number, sizePx: number): number {
  const outputScaleDeg = computeTanScaleDeg(fovDeg, sizePx);
  const order = Math.ceil(Math.log2(ORDER_ZERO_PIXEL_DEG / outputScaleDeg));
  return Math.max(0, Math.min(9, order));
}

/** TAN plate scale in degrees per output pixel. CDELT1 is negative (east left). */
export function computeTanScaleDeg(fovDeg: number, sizePx: number): number {
  return (2 * Math.tan((fovDeg * DEG) / 2) * 180) / PI / sizePx;
}

/**
 * Inverse TAN projection for one texture pixel. The pixel grid is north-up and
 * east-left, matching the WebGL shader that consumes the texture.
 */
export function tanPixelToRaDec(
  raDeg: number,
  decDeg: number,
  scaleDeg: number,
  xPx: number,
  yPx: number,
  sizePx: number,
): SkyPosition {
  return prepareTanProjection(raDeg, decDeg, scaleDeg, sizePx)(xPx, yPx);
}

export function prepareTanProjection(raDeg: number, decDeg: number, scaleDeg: number, sizePx: number) {
  const ra0 = raDeg * DEG;
  const sinDec0 = Math.sin(decDeg * DEG);
  const cosDec0 = Math.cos(decDeg * DEG);
  const center = sizePx / 2;
  return (xPx: number, yPx: number): SkyPosition => {
    const xi = (center - (xPx + 0.5)) * scaleDeg * DEG;
    const eta = (center - (yPx + 0.5)) * scaleDeg * DEG;
    // Inverse TAN: the ray has tangent-plane coordinates (xi, eta, 1).
    const normal = Math.sqrt(1 + xi * xi + eta * eta);
    const dec = Math.asin(clip((sinDec0 + eta * cosDec0) / normal, -1, 1));
    const ra = ra0 + Math.atan2(xi, cosDec0 - eta * sinDec0);
    return { raDeg: wrap(ra / DEG, 360), decDeg: dec / DEG };
  };
}

function sigma(z: number): number {
  if (z < 0) return -sigma(-z);
  return 2 - Math.sqrt(3 * (1 - z));
}

function sphericalToProjection(z: number, a: number): [number, number] {
  if (Math.abs(z) <= 2 / 3) {
    return [a, (3 * PI_8) * z];
  }
  const quadrant = a % (PI / 2);
  const sigmaValue = sigma(z);
  return [
    a - (Math.abs(sigmaValue) - 1) * (quadrant - PI_4),
    PI_4 * sigmaValue,
  ];
}

function projectionToBasePixel(
  t: number,
  u: number,
): { f: number; p: number; q: number } {
  let tUnits = t / PI_4;
  const uUnits = u / PI_4;
  tUnits = wrap(tUnits, 8) - 4;
  const shiftedU = uUnits + 5;

  const pp = clip((shiftedU + tUnits) / 2, 0, 5);
  const ppFloor = Math.floor(pp);
  const qq = clip((shiftedU - tUnits) / 2, 3 - ppFloor, 6 - ppFloor);
  const qqFloor = Math.floor(qq);
  const v = 5 - (ppFloor + qqFloor);
  if (v < 0) return { f: 0, p: 1, q: 1 };

  const h = ppFloor - qqFloor + 4;
  return { f: 4 * v + ((h >> 1) % 4), p: pp % 1, q: qq % 1 };
}

function spreadBits9(value: number): number {
  let bits = value;
  bits = (bits | (bits << 8)) & 0x00ff00ff;
  bits = (bits | (bits << 4)) & 0x0f0f0f0f;
  bits = (bits | (bits << 2)) & 0x33333333;
  bits = (bits | (bits << 1)) & 0x55555555;
  return bits >>> 0;
}

function bitCombine(x: number, y: number): number {
  return (spreadBits9(x) + spreadBits9(y) * 2) >>> 0;
}

let hpxToXy: Int32Array | null = null;

/**
 * Aladin HiPS stores nested HEALPix sub-pixels in a 512x512 tile. This builds
 * the sub-pixel index -> tile pixel table once. Tile rows are stored bottom-up
 * relative to FITS, so callers flip the row when reading the JPEG.
 */
function getHpxToXy(): Int32Array {
  if (hpxToXy) return hpxToXy;

  const size = 512;
  const xyToHpx = new Int32Array(size * size);
  const fill = (positions: Int32Array | null, n: number): void => {
    const total = n * n;
    const children = Array.from(
      { length: 4 },
      () => new Int32Array(total / 4),
    );
    const counts = [0, 0, 0, 0];
    for (let index = 0; index < total; index += 1) {
      const column = index % n;
      const row = Math.floor(index / n);
      const quadrant = ((column < n / 2 ? 0 : 2) | (row < n / 2 ? 1 : 0)) as 0 | 1 | 2 | 3;
      const target = positions ? positions[index] : index;
      xyToHpx[target] = (xyToHpx[target] << 2) | quadrant;
      children[quadrant][counts[quadrant]] = target;
      counts[quadrant] += 1;
    }
    if (total > 4) {
      for (let quadrant = 0; quadrant < 4; quadrant += 1) {
        fill(children[quadrant], n / 2);
      }
    }
  };
  fill(null, size);

  const table = new Int32Array(size * size);
  for (let index = 0; index < xyToHpx.length; index += 1) {
    table[xyToHpx[index]] = index;
  }
  hpxToXy = table;
  return table;
}

/** Maps an equatorial position to its HiPS tile and pixel inside that tile. */
export function raDecToHipsTile(
  raDeg: number,
  decDeg: number,
  order: number,
): HipsTilePosition {
  const z = Math.sin(decDeg * DEG);
  const a = wrap(raDeg * DEG, 2 * PI);
  const [t, u] = sphericalToProjection(z, a);
  const { f, p, q } = projectionToBasePixel(t, u);

  const nside = 1 << order;
  const pixelX = p * nside;
  const pixelY = q * nside;
  const cellX = clip(Math.floor(pixelX), 0, nside - 1);
  const cellY = clip(Math.floor(pixelY), 0, nside - 1);
  const subX = clip(Math.floor((pixelX - cellX) * 512), 0, 511);
  const subY = clip(Math.floor((pixelY - cellY) * 512), 0, 511);

  const ipix = f * nside * nside + bitCombine(cellX, cellY);
  const tilePixel = getHpxToXy()[bitCombine(subX, subY)];
  return {
    ipix,
    xPx: tilePixel % 512,
    yPx: 511 - Math.floor(tilePixel / 512),
  };
}
