import { expect, it } from "vitest";
import { computeSolarSystem } from "../src/services/solarSystem";
import { solarScreenGeometry } from "../src/components/SkyView/solarLayer";
import { basisForView } from "../src/services/viewProjection";

it("places the topocentric Moon near the Sun during the Dallas eclipse", () => {
  const { bodies, sun } = computeSolarSystem(new Date("2024-04-08T18:40:00Z"), 32.7767, -96.797);
  expect(bodies).toHaveLength(12);
  const moon = bodies.find(body => body.id === "moon")!;
  expect(moon.raHours).toBeGreaterThan(1);
  expect(moon.raHours).toBeLessThan(1.5);
  expect(Math.abs(moon.raHours - sun.raHours) * 15).toBeLessThan(0.3);
  expect(Math.abs(moon.altDeg - sun.altDeg)).toBeLessThan(0.3);
  expect(moon.angularDiameterDeg).toBeGreaterThan(0.5);
});

it("keeps the lunar disk at its true angular scale even when larger than the view", () => {
  const { bodies } = computeSolarSystem(new Date("2024-04-08T18:40:00Z"), 32.7767, -96.797);
  const moon = bodies.find(body => body.id === "moon")!;
  const camera = { basis: basisForView(moon.altDeg, moon.azDeg), width: 1000, height: 800, dpr: 1 };
  expect(solarScreenGeometry(moon, { ...camera, fovDeg: moon.angularDiameterDeg })!.radiusPx).toBeCloseTo(400);
  expect(solarScreenGeometry(moon, { ...camera, fovDeg: 0.1 })!.radiusPx).toBeGreaterThan(400);
});
