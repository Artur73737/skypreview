import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { raDecToAltAz, altAzToRaDec, angularSeparationDeg } from "../src/services/astroMath";
import { basisForView, projectAltAz, unprojectToAltAz } from "../src/services/viewProjection";
import { getHipsCutoutUrl } from "../src/services/hips";
import { computeFov } from "../src/services/fov";
import { searchCatalogs, type CatalogBundle } from "../src/services/catalog";
import { CAMERA_PRESETS, TELESCOPE_PRESETS } from "../src/data/equipment";

const read = (name: string) => JSON.parse(readFileSync(new URL(`../public/data/${name}.json`, import.meta.url), "utf8"));
const bundle: CatalogBundle = { stars: read("stars"), dso: read("dso"), constellations: read("constellations") };

describe("catalogue units and completeness", () => {
  it("keeps Sirius and Vega in hours, spread across the full RA range", () => {
    expect(bundle.stars.find(s => s.name === "Sirius")!.raHours).toBeCloseTo(6.75248, 3);
    expect(bundle.stars.find(s => s.name === "Vega")!.raHours).toBeCloseTo(18.61565, 3);
    const bins = new Set(bundle.stars.map(s => Math.floor(s.raHours)));
    expect(bins.size).toBe(24);
  });
  it("places all 88 constellations across the sky with catalogue-aligned endpoints", () => {
    expect(bundle.constellations).toHaveLength(88);
    const points = bundle.constellations.flatMap(c => c.lines.flat());
    expect(Math.max(...points.map(p => p[0]))).toBeGreaterThan(23);
    const vega = bundle.stars.find(s => s.name === "Vega")!;
    expect(points.some(([ra, dec]) => Math.abs(ra - vega.raHours) < 0.001 && Math.abs(dec - vega.decDeg) < 0.001)).toBe(true);
  });
  it("does not turn missing OpenNGC magnitudes into magnitude zero", () => {
    expect(bundle.dso.filter(d => d.mag === 0).length).toBeLessThan(5);
    expect(bundle.dso.find(d => d.messier === "M31")!.mag).toBeCloseTo(3.44);
    expect(searchCatalogs(bundle, "M1")[0].label).toMatch(/^M1 ·/);
  });
});

describe("spherical projections", () => {
  it.each([[0,0], [23.999,75], [6,-80], [18,89.9]])("round-trips RA %s, Dec %s", (ra, dec) => {
    const date = new Date("2026-09-22T20:00:00Z");
    const a = raDecToAltAz(ra,dec,45.4642,9.19,date);
    const b = altAzToRaDec(a.altDeg,a.azDeg,45.4642,9.19,date);
    expect(angularSeparationDeg(ra,dec,b.raHours,b.decDeg)).toBeLessThan(0.00001);
  });
  it.each([0.3,8,75,120])("round-trips viewport corners at %s degrees", fov => {
    const basis = basisForView(35,180);
    for (const [x,y] of [[1,1],[1679,848],[840,424]]) {
      const a = unprojectToAltAz(x,y,basis,fov,1680,849);
      const p = projectAltAz(a.altDeg,a.azDeg,basis,fov,1680,849);
      expect(p.visible).toBe(true);
      expect(p.x).toBeCloseTo(x,6);
      expect(p.y).toBeCloseTo(y,6);
    }
  });
  it("projects a point at the celestial pole without NaN", () => {
    const a=raDecToAltAz(0,90,90,0,new Date("2026-09-22"));
    expect(Number.isFinite(a.azDeg)).toBe(true);
    expect(a.altDeg).toBeCloseTo(90);
  });
});

describe("survey astrometry and custom optics", () => {
  it("ships the requested quick-pick catalogs", () => {
    expect(CAMERA_PRESETS).toHaveLength(25);
    expect(CAMERA_PRESETS.find(c => c.name === "ASI2600MC Pro")?.pixelUm).toBe(3.76);
    expect(CAMERA_PRESETS.find(c => c.name === "SV605MC")?.resXpx).toBe(3008);
    expect(TELESCOPE_PRESETS).toHaveLength(22);
    expect(TELESCOPE_PRESETS.find(t => t.name === "Askar 71F")?.resolutionArcsec).toBeCloseTo(1.64);
    expect(TELESCOPE_PRESETS.find(t => t.name === "Celestron C11 / EdgeHD 11")?.focalMm).toBe(2800);
  });
  it("uses exact TAN scale, full wide fields, and resolution-aware cache keys", () => {
    const low=getHipsCutoutUrl(10.6848,41.2691,120,384);
    const high=getHipsCutoutUrl(10.6848,41.2691,120,1536);
    expect(low.fovDeg).toBe(120);
    expect(low.key).not.toBe(high.key);
    const wcs=JSON.parse(new URL(high.url).searchParams.get("wcs")!);
    expect(wcs.CRVAL1).toBeCloseTo(10.6848, 10);
    expect(wcs.CDELT1 * 1536 * Math.PI / 180).toBeCloseTo(-2*Math.tan(Math.PI/3),8);
    expect(wcs.CRPIX1).toBe(768.5);
      expect(new URL(high.url).searchParams.get("format")).toBe("png");
      expect(new URL(high.url).searchParams.get("stretch")).toBe("asinh");
  });
  it("computes non-preset focal lengths with reducers and large sensors", () => {
    const f=computeFov(873.5,132.7,0.73,12000,8000,3.45);
    expect(f.effectiveFocalMm).toBeCloseTo(637.655);
    expect(f.widthDeg).toBeCloseTo(2*Math.atan(41.4/(2*637.655))*180/Math.PI,8);
    expect(f.diagonalDeg).toBeGreaterThan(f.widthDeg);
    expect(Number.isFinite(f.samplingArcsecPx)).toBe(true);
  });
});
