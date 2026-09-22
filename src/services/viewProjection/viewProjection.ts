const DEG = Math.PI / 180;

export type Vec3 = [number, number, number];

export function vecFromAltAz(altDeg: number, azDeg: number): Vec3 {
  const alt = altDeg * DEG;
  const az = azDeg * DEG;
  return [Math.cos(alt) * Math.sin(az), Math.cos(alt) * Math.cos(az), Math.sin(alt)];
}

export function altAzFromVec(v: Vec3): { altDeg: number; azDeg: number } {
  const n = Math.hypot(v[0], v[1], v[2]) || 1;
  const altDeg = Math.asin(Math.max(-1, Math.min(1, v[2] / n))) / DEG;
  let azDeg = Math.atan2(v[0] / n, v[1] / n) / DEG;
  if (azDeg < 0) azDeg += 360;
  return { altDeg, azDeg };
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function norm(v: Vec3): Vec3 {
  const n = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / n, v[1] / n, v[2] / n];
}

export interface ViewBasis {
  forward: Vec3;
  right: Vec3;
  up: Vec3;
}

function normSafe(v: Vec3, fallback: Vec3): Vec3 {
  const n = Math.hypot(v[0], v[1], v[2]);
  if (n < 1e-9) return fallback;
  return [v[0] / n, v[1] / n, v[2] / n];
}

export function basisForView(altDeg: number, azDeg: number): ViewBasis {
  const forward = vecFromAltAz(altDeg, azDeg);
  const worldUp: Vec3 = [0, 0, 1];
  const right = normSafe(cross(forward, worldUp), [1, 0, 0]);
  const up = cross(right, forward);
  return { forward, right, up };
}

export interface Projected {
  x: number;
  y: number;
  visible: boolean;
}

export function projectAltAz(
  altDeg: number,
  azDeg: number,
  basis: ViewBasis,
  fovVertDeg: number,
  width: number,
  height: number,
): Projected {
  const p = vecFromAltAz(altDeg, azDeg);
  const cx = p[0] * basis.right[0] + p[1] * basis.right[1] + p[2] * basis.right[2];
  const cy = p[0] * basis.up[0] + p[1] * basis.up[1] + p[2] * basis.up[2];
  const cz = p[0] * basis.forward[0] + p[1] * basis.forward[1] + p[2] * basis.forward[2];
  if (cz <= 0.001) return { x: -9999, y: -9999, visible: false };
  const f = height / 2 / Math.tan((fovVertDeg * DEG) / 2);
  const x = width / 2 + (cx / cz) * f;
  const y = height / 2 - (cy / cz) * f;
  return { x, y, visible: x > -height && x < width + height && y > -height && y < height * 2 };
}

export function unprojectToAltAz(
  x: number,
  y: number,
  basis: ViewBasis,
  fovVertDeg: number,
  width: number,
  height: number,
): { altDeg: number; azDeg: number } {
  const f = height / 2 / Math.tan((fovVertDeg * DEG) / 2);
  const sx = (x - width / 2) / f;
  const sy = (height / 2 - y) / f;
  const dir: Vec3 = norm([
    basis.forward[0] + sx * basis.right[0] + sy * basis.up[0],
    basis.forward[1] + sx * basis.right[1] + sy * basis.up[1],
    basis.forward[2] + sx * basis.right[2] + sy * basis.up[2],
  ]);
  return altAzFromVec(dir);
}
