import type { HipsCutout } from "./hips";
import {
  computeTanScaleDeg,
  healpixTileOrder,
  raDecToHipsTile,
  tanPixelToRaDec,
} from "./healpix";

// DSS2 color is published as a static HiPS. These mirrors expose it with CORS,
// so the browser can stitch tiles without a server-side cutout service.
export const HIPS_SURVEY_MIRRORS = [
  "https://skies.esac.esa.int/DSSColor",
  "https://stpubdata.s3.us-east-1.amazonaws.com/mast/skybackgrounds/DSSColor",
  "https://casda.csiro.au/hips/DSS2/color",
] as const;

const TILE_SIZE = 512;
const TILE_CACHE_LIMIT = 96;
const TEXTURE_CACHE_BYTES = 128 * 1024 * 1024;
const SAMPLE_STRIDE = 8;
const YIELD_ROWS = 128;
const TILE_TIMEOUT_MS = 12000;
const BACKGROUND = [2, 4, 9, 255] as const;

export interface HipsTileData {
  width: number;
  height: number;
  pixels: Uint8ClampedArray;
}

const tileCache = new Map<string, HipsTileData>();
const textureCache = new Map<string, HTMLCanvasElement>();

export function getHipsTileUrl(
  baseUrl: string,
  order: number,
  ipix: number,
): string {
  const directory = Math.floor(ipix / 10000) * 10000;
  const base = baseUrl.replace(/\/+$/, "");
  return `${base}/Norder${order}/Dir${directory}/Npix${ipix}.jpg`;
}

function abortError(): DOMException {
  return new DOMException("Aborted", "AbortError");
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw abortError();
}

function timeoutSignal(signal: AbortSignal | undefined): AbortSignal {
  const timeout = AbortSignal.timeout(TILE_TIMEOUT_MS);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

async function decodeTile(blob: Blob): Promise<HipsTileData> {
  const bitmap = await createImageBitmap(blob);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Canvas 2D non disponibile");
    context.drawImage(bitmap, 0, 0);
    const image = context.getImageData(0, 0, bitmap.width, bitmap.height);
    return {
      width: bitmap.width,
      height: bitmap.height,
      pixels: image.data,
    };
  } finally {
    bitmap.close();
  }
}

async function fetchTilePixels(
  order: number,
  ipix: number,
  signal?: AbortSignal,
): Promise<HipsTileData | null> {
  let lastError: unknown = null;
  for (const mirror of HIPS_SURVEY_MIRRORS) {
    try {
      const response = await fetch(getHipsTileUrl(mirror, order, ipix), {
        signal: timeoutSignal(signal),
        mode: "cors",
        cache: "force-cache",
      });
      if (response.status === 404) continue;
      if (!response.ok) throw new Error(`DSS2 tile: HTTP ${response.status}`);
      return await decodeTile(await response.blob());
    } catch (error) {
      if (signal?.aborted) throw abortError();
      lastError = error;
    }
  }
  if (lastError) throw lastError;
  return null;
}

async function getTile(
  order: number,
  ipix: number,
  signal?: AbortSignal,
): Promise<HipsTileData | null> {
  const key = `${order}/${ipix}`;
  const cached = tileCache.get(key);
  if (cached) {
    tileCache.delete(key);
    tileCache.set(key, cached);
    return cached;
  }

  const tile = await fetchTilePixels(order, ipix, signal);
  if (tile) {
    tileCache.set(key, tile);
    if (tileCache.size > TILE_CACHE_LIMIT) tileCache.delete(tileCache.keys().next().value!);
  }
  return tile;
}

function samplePositions(sizePx: number): number[] {
  const positions: number[] = [];
  for (let value = 0; value < sizePx; value += SAMPLE_STRIDE) {
    positions.push(value);
  }
  if (positions[positions.length - 1] !== sizePx - 1) positions.push(sizePx - 1);
  return positions;
}

/** Lists the HiPS tiles that can cover the requested TAN view. */
export function findHipsTiles(cutout: HipsCutout, order: number): number[] {
  const scale = computeTanScaleDeg(cutout.fovDeg, cutout.sizePx);
  const positions = samplePositions(cutout.sizePx);
  const tiles = new Set<number>();
  for (const yPx of positions) {
    for (const xPx of positions) {
      const { raDeg, decDeg } = tanPixelToRaDec(
        cutout.raDeg,
        cutout.decDeg,
        scale,
        xPx,
        yPx,
        cutout.sizePx,
      );
      tiles.add(raDecToHipsTile(raDeg, decDeg, order).ipix);
    }
  }
  return [...tiles];
}

function fillBackground(target: Uint8ClampedArray): void {
  for (let offset = 0; offset < target.length; offset += 4) {
    target[offset] = BACKGROUND[0];
    target[offset + 1] = BACKGROUND[1];
    target[offset + 2] = BACKGROUND[2];
    target[offset + 3] = BACKGROUND[3];
  }
}

function renderRows(
  cutout: HipsCutout,
  order: number,
  tiles: Map<number, HipsTileData>,
  target: Uint8ClampedArray,
  fromRow: number,
  toRow: number,
): void {
  const size = cutout.sizePx;
  const scale = computeTanScaleDeg(cutout.fovDeg, size);
  for (let yPx = fromRow; yPx < toRow; yPx += 1) {
    for (let xPx = 0; xPx < size; xPx += 1) {
      const { raDeg, decDeg } = tanPixelToRaDec(
        cutout.raDeg,
        cutout.decDeg,
        scale,
        xPx,
        yPx,
        size,
      );
      const position = raDecToHipsTile(raDeg, decDeg, order);
      const tile = tiles.get(position.ipix);
      if (!tile) continue;

      const tileX = Math.min(
        tile.width - 1,
        Math.floor((position.xPx * tile.width) / TILE_SIZE),
      );
      const tileY = Math.min(
        tile.height - 1,
        Math.floor((position.yPx * tile.height) / TILE_SIZE),
      );
      const source = (tileY * tile.width + tileX) * 4;
      const offset = (yPx * size + xPx) * 4;
      target[offset] = tile.pixels[source];
      target[offset + 1] = tile.pixels[source + 1];
      target[offset + 2] = tile.pixels[source + 2];
      target[offset + 3] = 255;
    }
  }
}

/**
 * Renders a full north-up/east-left TAN texture into an RGBA buffer. Exposed
 * separately from the canvas so the pixel mapping can be tested in Node.
 */
export function renderHipsPixels(
  cutout: HipsCutout,
  order: number,
  tiles: Map<number, HipsTileData>,
  target: Uint8ClampedArray,
): void {
  fillBackground(target);
  renderRows(cutout, order, tiles, target, 0, cutout.sizePx);
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(resolve, 0);
    }
  });
}

function cacheTexture(key: string, canvas: HTMLCanvasElement): void {
  textureCache.delete(key);
  textureCache.set(key, canvas);
  let bytes = [...textureCache.values()].reduce((sum, image) => sum + image.width * image.height * 4, 0);
  while (bytes > TEXTURE_CACHE_BYTES) {
    const oldest = textureCache.keys().next().value as string | undefined;
    if (!oldest) break;
    const image = textureCache.get(oldest)!;
    bytes -= image.width * image.height * 4;
    textureCache.delete(oldest);
  }
}

/**
 * Stitches DSS2 HiPS tiles into a square TAN texture. Sampling is chunked by
 * rows so a 2048 px view does not block the UI thread.
 */
export async function loadHipsTexture(
  cutout: HipsCutout,
  signal?: AbortSignal,
  maxOrder = 9,
): Promise<HTMLCanvasElement> {
  const order = Math.min(maxOrder, healpixTileOrder(cutout.fovDeg, cutout.sizePx));
  const key = `${cutout.key}|${order}`;
  const cached = textureCache.get(key);
  if (cached) {
    textureCache.delete(key);
    textureCache.set(key, cached);
    return cached;
  }
  const tileIds = findHipsTiles(cutout, order);
  const tiles = new Map<number, HipsTileData>();
  await Promise.all(
    tileIds.map(async (ipix) => {
      try {
        const tile = await getTile(order, ipix, signal);
        if (tile) tiles.set(ipix, tile);
      } catch {
        // A missing tile leaves the background color; the view still renders.
      }
    }),
  );
  throwIfAborted(signal);

  if (tiles.size === 0) throw new Error("No DSS2 tiles loaded");

  const canvas = document.createElement("canvas");
  canvas.width = cutout.sizePx;
  canvas.height = cutout.sizePx;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D non disponibile");

  const image = context.createImageData(cutout.sizePx, cutout.sizePx);
  fillBackground(image.data);
  for (let row = 0; row < cutout.sizePx; row += YIELD_ROWS) {
    renderRows(
      cutout,
      order,
      tiles,
      image.data,
      row,
      Math.min(row + YIELD_ROWS, cutout.sizePx),
    );
    await nextFrame();
    throwIfAborted(signal);
  }

  context.putImageData(image, 0, 0);
  if (tiles.size === tileIds.length) cacheTexture(key, canvas);
  return canvas;
}
