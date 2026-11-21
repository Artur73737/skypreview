import {
  drawTexturedBody,
  type SolarBodyId,
  type SolarBodySnapshot,
  type SolarSystemSnapshot,
  type SolarTextures,
  type SunSnapshot,
} from "../../services/solarSystem";
import {
  projectAltAz,
  vecFromAltAz,
  type ViewBasis,
} from "../../services/viewProjection";

const DEG = Math.PI / 180;
const LABEL_PRIORITY: SolarBodyId[] = [
  "moon",
  "venus",
  "jupiter",
  "saturn",
  "mars",
  "mercury",
  "uranus",
  "neptune",
];

export interface SolarCamera {
  basis: ViewBasis;
  fovDeg: number;
  width: number;
  height: number;
  dpr: number;
}

export interface SolarGeometry {
  body: SolarBodySnapshot;
  x: number;
  y: number;
  radiusPx: number;
}

export interface SolarDrawOptions {
  camera: SolarCamera;
  snapshot: SolarSystemSnapshot;
  textures: SolarTextures;
  selectedId: SolarBodyId | null;
  dimBelowHorizon: boolean;
  claimLabel: (x: number, y: number, text: string) => boolean;
}

export function solarScreenGeometry(
  body: SolarBodySnapshot,
  camera: SolarCamera,
): SolarGeometry | null {
  const projected = projectAltAz(
    body.altDeg,
    body.azDeg,
    camera.basis,
    camera.fovDeg,
    camera.width,
    camera.height,
  );
  if (!projected.visible) return null;
  const focal = camera.height / 2 / Math.tan((camera.fovDeg * DEG) / 2);
  const radiusPx = focal * Math.tan((body.angularDiameterDeg * DEG) / 2);
  return {
    body,
    x: projected.x,
    y: projected.y,
    radiusPx: radiusPx,
  };
}

function sunScreenAngleRad(
  body: SolarBodySnapshot,
  sun: SunSnapshot,
  basis: ViewBasis,
): number {
  const bodyVector = vecFromAltAz(body.altDeg, body.azDeg);
  const sunVector = vecFromAltAz(sun.altDeg, sun.azDeg);
  const dot =
    bodyVector[0] * sunVector[0] +
    bodyVector[1] * sunVector[1] +
    bodyVector[2] * sunVector[2];
  const tangent = [
    sunVector[0] - dot * bodyVector[0],
    sunVector[1] - dot * bodyVector[1],
    sunVector[2] - dot * bodyVector[2],
  ] as const;
  const x =
    tangent[0] * basis.right[0] +
    tangent[1] * basis.right[1] +
    tangent[2] * basis.right[2];
  const up =
    tangent[0] * basis.up[0] +
    tangent[1] * basis.up[1] +
    tangent[2] * basis.up[2];
  if (Math.hypot(x, up) < 1e-9) return 0;
  return Math.atan2(-up, x);
}

function opacityFor(body: SolarBodySnapshot, dimBelowHorizon: boolean): number {
  return body.altDeg < 0 && dimBelowHorizon ? 0.18 : 1;
}

function drawMarker(
  context: CanvasRenderingContext2D,
  geometry: SolarGeometry,
  camera: SolarCamera,
  opacity: number,
): void {
  const { body, x, y } = geometry;
  const radius = Math.max(2.2 * camera.dpr, Math.min(geometry.radiusPx, 3.2 * camera.dpr));
  context.save();
  context.globalAlpha = opacity;
  context.fillStyle = body.definition.color;
  context.shadowColor = body.definition.color;
  context.shadowBlur = 10 * camera.dpr;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawBody(
  context: CanvasRenderingContext2D,
  geometry: SolarGeometry,
  options: SolarDrawOptions,
): void {
  const { body, x, y, radiusPx } = geometry;
  const { camera, textures } = options;
  const opacity = opacityFor(body, options.dimBelowHorizon);
  const image = textures.images[body.id];

  if (image && radiusPx >= 1) {
    drawTexturedBody(context, image, x, y, radiusPx, {
      phaseFraction: body.phaseFraction,
      sunAngleRad: sunScreenAngleRad(body, options.snapshot.sun, camera.basis),
      opacity,
      ringTiltDeg: body.ringTiltDeg,
      ringAlpha: textures.ringAlpha,
    });
    return;
  }

  if (radiusPx < 1) {
    drawMarker(context, geometry, camera, opacity);
    return;
  }

  context.save();
  context.globalAlpha = opacity;
  context.fillStyle = body.definition.color;
  context.beginPath();
  context.arc(x, y, radiusPx, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawSelectionRing(
  context: CanvasRenderingContext2D,
  geometry: SolarGeometry,
  camera: SolarCamera,
): void {
  context.strokeStyle = "rgba(248,250,252,0.95)";
  context.lineWidth = 1.4 * camera.dpr;
  context.beginPath();
  context.arc(
    geometry.x,
    geometry.y,
    Math.max(12 * camera.dpr, geometry.radiusPx + 7 * camera.dpr),
    0,
    Math.PI * 2,
  );
  context.stroke();
}

function drawLabel(
  context: CanvasRenderingContext2D,
  geometry: SolarGeometry,
  camera: SolarCamera,
  options: SolarDrawOptions,
): void {
  const { body, x, y, radiusPx } = geometry;
  const offset = Math.min(radiusPx + 8 * camera.dpr, 70 * camera.dpr);
  const labelX = x + offset;
  const labelY = y - offset * 0.45;
  if (!options.claimLabel(labelX, labelY, body.label)) return;
  context.save();
  context.globalAlpha = opacityFor(body, options.dimBelowHorizon) * 0.92;
  context.font = `${12.5 * camera.dpr}px system-ui`;
  context.fillStyle = "#f1f5f9";
  context.shadowColor = "rgba(0,0,0,0.9)";
  context.shadowBlur = 4 * camera.dpr;
  context.fillText(body.label, labelX, labelY);
  context.restore();
}

export function drawSolarLayer(
  context: CanvasRenderingContext2D,
  options: SolarDrawOptions,
): void {
  const geometries = options.snapshot.bodies
    .map((body) => solarScreenGeometry(body, options.camera))
    .filter((geometry): geometry is SolarGeometry => geometry !== null)
    .sort((a, b) => b.body.distanceKm - a.body.distanceKm);

  for (const geometry of geometries) drawBody(context, geometry, options);

  if (options.selectedId) {
    const selected = geometries.find((geometry) => geometry.body.id === options.selectedId);
    if (selected) drawSelectionRing(context, selected, options.camera);
  }

  const byPriority = [...geometries].sort(
    (a, b) =>
      LABEL_PRIORITY.indexOf(a.body.id) - LABEL_PRIORITY.indexOf(b.body.id),
  );
  for (const geometry of byPriority) drawLabel(context, geometry, options.camera, options);
}

export function pickSolarBody(
  x: number,
  y: number,
  snapshot: SolarSystemSnapshot,
  camera: SolarCamera,
): SolarBodySnapshot | null {
  let best: SolarBodySnapshot | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const body of snapshot.bodies) {
    const geometry = solarScreenGeometry(body, camera);
    if (!geometry) continue;
    const distance = Math.hypot(x - geometry.x, y - geometry.y);
    const tolerance = Math.max(14 * camera.dpr, geometry.radiusPx + 8 * camera.dpr);
    if (distance > tolerance) continue;
    const score = distance / tolerance;
    if (score < bestScore) {
      bestScore = score;
      best = body;
    }
  }
  return best;
}
