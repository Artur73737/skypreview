import type { HipsCutout } from "./hips";

interface PackTile extends HipsCutout { file: string; sizePx: number; }
interface SkyPackManifest { version: number; tiles: PackTile[]; }
let manifestPromise: Promise<SkyPackManifest | null> | null = null;

function loadManifest(): Promise<SkyPackManifest | null> {
  if (manifestPromise) return manifestPromise;
  manifestPromise = fetch(new URL("surveys/pack/manifest.json", window.location.href).toString(), { cache: "force-cache" })
    .then(async response => response.ok ? response.json() as Promise<SkyPackManifest> : null)
    .catch(() => null);
  return manifestPromise;
}

function separation(raA: number, decA: number, raB: number, decB: number) {
  const dra = Math.abs(((raA - raB + 540) % 360) - 180) * Math.PI / 180;
  const a = decA * Math.PI / 180; const b = decB * Math.PI / 180;
  return Math.acos(Math.max(-1, Math.min(1, Math.sin(a) * Math.sin(b) + Math.cos(a) * Math.cos(b) * Math.cos(dra)))) * 180 / Math.PI;
}

export async function findLocalSkyCutout(request: HipsCutout): Promise<HipsCutout | null> {
  const manifest = await loadManifest();
  if (!manifest?.tiles?.length) return null;
  const candidates = manifest.tiles
    .filter(tile => tile.fovDeg >= request.fovDeg * 0.95 && tile.fovDeg <= request.fovDeg * 1.8)
    .map(tile => ({ tile, distance: separation(request.raDeg, request.decDeg, tile.raDeg, tile.decDeg) }))
    .filter(({ tile, distance }) => distance <= tile.fovDeg * 0.52)
    .sort((a, b) => Math.abs(a.tile.fovDeg - request.fovDeg) - Math.abs(b.tile.fovDeg - request.fovDeg) || a.distance - b.distance);
  const hit = candidates[0]?.tile;
  if (!hit) return null;
  const base = new URL("surveys/pack/", window.location.href);
  return { ...hit, url: new URL(hit.file, base).toString(), key: `local:${hit.key}` };
}
