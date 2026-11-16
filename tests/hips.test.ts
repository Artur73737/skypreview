import { describe, expect, it } from "vitest";
import {
  HIPS_SURVEY_MIRRORS,
  computeTanScaleDeg,
  findHipsTiles,
  getHipsCutout,
  getHipsTileUrl,
  healpixTileOrder,
  raDecToHipsTile,
  renderHipsPixels,
  tanPixelToRaDec,
  type HipsTileData,
} from "../src/services/hips";

describe("HiPS tile geometry", () => {
  it("maps M31 to the validated DSS tile pixel", () => {
    const position = raDecToHipsTile(10.6848, 41.2691, 6);
    expect(position).toEqual({ ipix: 2709, xPx: 32, yPx: 132 });
  });

  it("picks an order that supersamples the output texture", () => {
    expect(healpixTileOrder(4, 2048)).toBe(6);
    expect(healpixTileOrder(120, 2048)).toBe(1);
    expect(healpixTileOrder(0.25, 2048)).toBe(9);
    expect(healpixTileOrder(170, 2048)).toBe(0);
  });

  it("builds IVOA HiPS tile paths", () => {
    expect(
      getHipsTileUrl("https://skies.esac.esa.int/DSSColor/", 6, 2709),
    ).toBe("https://skies.esac.esa.int/DSSColor/Norder6/Dir0/Npix2709.jpg");
    expect(getHipsTileUrl("https://example.org/hips", 9, 123456)).toBe(
      "https://example.org/hips/Norder9/Dir120000/Npix123456.jpg",
    );
  });

  it("keeps the TAN grid north-up and east-left", () => {
    const scale = computeTanScaleDeg(4, 2048);
    const center = tanPixelToRaDec(10, 40, scale, 1023.5, 1023.5, 2048);
    expect(center.raDeg).toBeCloseTo(10, 8);
    expect(center.decDeg).toBeCloseTo(40, 8);

    expect(tanPixelToRaDec(10, 40, scale, 0, 1023.5, 2048).raDeg).toBeGreaterThan(10);
    expect(tanPixelToRaDec(10, 40, scale, 2047, 1023.5, 2048).raDeg).toBeLessThan(10);
    expect(tanPixelToRaDec(10, 40, scale, 1023.5, 0, 2048).decDeg).toBeGreaterThan(40);
    expect(tanPixelToRaDec(10, 40, scale, 1023.5, 2047, 2048).decDeg).toBeLessThan(40);
  });
});

describe("HiPS cutouts and stitching", () => {
  it("builds cutouts with stable resolution-aware cache keys", () => {
    const low = getHipsCutout(370, 45, 120, 384);
    const high = getHipsCutout(10, 45, 120, 2048);
    expect(low.raDeg).toBe(10);
    expect(low.sizePx).toBe(384);
    expect(high.sizePx).toBe(2048);
    expect(low.key).not.toBe(high.key);
    expect(getHipsCutout(10, 45, 400).fovDeg).toBe(170);
    expect(getHipsCutout(10, 45, 0.01).fovDeg).toBe(0.15);
  });

  it("finds the tiles touched by a view", () => {
    const cutout = getHipsCutout(10.6848, 41.2691, 1.5, 512);
    const order = healpixTileOrder(cutout.fovDeg, cutout.sizePx);
    const tiles = findHipsTiles(cutout, order);
    expect(tiles).toContain(raDecToHipsTile(10.6848, 41.2691, order).ipix);
    expect(tiles.length).toBeGreaterThan(0);
    expect(tiles.length).toBeLessThan(32);
  });

  it("renders a north-up texture from decoded tile pixels", () => {
    const cutout = getHipsCutout(10.6848, 41.2691, 1, 17);
    const order = 7;
    const center = raDecToHipsTile(10.6848, 41.2691, order);
    const pixels = new Uint8ClampedArray(512 * 512 * 4);
    for (let offset = 0; offset < pixels.length; offset += 4) {
      pixels[offset] = 255;
      pixels[offset + 3] = 255;
    }
    const tiles = new Map<number, HipsTileData>([
      [center.ipix, { width: 512, height: 512, pixels }],
    ]);
    const target = new Uint8ClampedArray(17 * 17 * 4);

    renderHipsPixels(cutout, order, tiles, target);

    const centerOffset = (8 * 17 + 8) * 4;
    expect([...target.slice(centerOffset, centerOffset + 4)]).toEqual([255, 0, 0, 255]);
    expect([...target.slice(0, 4)]).toEqual([2, 4, 9, 255]);
  });

  it("keeps CORS-enabled DSS2 mirrors in priority order", () => {
    expect(HIPS_SURVEY_MIRRORS[0]).toBe("https://skies.esac.esa.int/DSSColor");
    expect(HIPS_SURVEY_MIRRORS).toContain(
      "https://stpubdata.s3.us-east-1.amazonaws.com/mast/skybackgrounds/DSSColor",
    );
    expect(HIPS_SURVEY_MIRRORS).toContain(
      "https://casda.csiro.au/hips/DSS2/color",
    );
  });
});
