import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\//, "").replace(/\//g, "\\");
const OUT = join(ROOT, "public", "surveys", "pack");
const BASES = ["https://alasky.cds.unistra.fr/hips-image-services/hips2fits", "https://alaskybis.cds.unistra.fr/hips-image-services/hips2fits"];
const LEVELS = [
  { fov: 60, size: 1024 },
  { fov: 30, size: 1024 },
  { fov: 15, size: 2048 },
];
const CONCURRENCY = Math.max(1, Number(process.env.SKY_PACK_CONCURRENCY ?? 8));
const FORCE = process.env.SKY_PACK_FORCE === "1";
const DRY_RUN = process.env.SKY_PACK_DRY_RUN === "1";

function urlFor(raDeg, decDeg, fovDeg, sizePx) {
  const scale = 2 * Math.tan(fovDeg * Math.PI / 360) * 180 / Math.PI / sizePx;
  const params = new URLSearchParams({
    wcs: JSON.stringify({ NAXIS: 2, NAXIS1: sizePx, NAXIS2: sizePx, CTYPE1: "RA---TAN", CTYPE2: "DEC--TAN", CRVAL1: raDeg, CRVAL2: decDeg, CRPIX1: (sizePx + 1) / 2, CRPIX2: (sizePx + 1) / 2, CDELT1: -scale, CDELT2: scale, CUNIT1: "deg", CUNIT2: "deg" }),
    hips: "CDS/P/DSS2/color", ra: raDeg.toFixed(4), dec: decDeg.toFixed(4), fov: fovDeg.toFixed(3), width: String(sizePx), height: String(sizePx), projection: "TAN", coordsys: "icrs", format: "jpg", stretch: "asinh", min_cut: "0.5%", max_cut: "99.5%",
  });
  return `${BASES[0]}?${params}`;
}

function tilesForLevel(level) {
  const step = level.fov * 0.75;
  const tiles = [];
  for (let dec = -90 + level.fov / 2; dec <= 90 - level.fov / 2 + 1e-6; dec += step) {
    for (let ra = 0; ra < 360; ra += step) {
      const raDeg = Number(ra.toFixed(4));
      const decDeg = Number(dec.toFixed(4));
      const key = `${level.fov}-${raDeg.toFixed(4)}-${decDeg.toFixed(4)}-${level.size}`;
      tiles.push({ key, raDeg, decDeg, fovDeg: level.fov, sizePx: level.size, url: urlFor(raDeg, decDeg, level.fov, level.size), file: `tiles/${key}.jpg` });
    }
  }
  return tiles;
}

async function exists(path) { try { await access(path); return true; } catch { return false; } }
async function download(tile) {
  const output = join(OUT, tile.file);
  if (!FORCE && await exists(output)) return "cached";
  let error;
  for (const base of BASES) {
    try {
      const response = await fetch(tile.url.replace(BASES[0], base), { signal: AbortSignal.timeout(35000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length < 1000 || bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error("risposta non JPEG");
      await writeFile(output, bytes);
      return "downloaded";
    } catch (err) { error = err; }
  }
  throw new Error(`${tile.key}: ${error?.message ?? error}`);
}

await mkdir(join(OUT, "tiles"), { recursive: true });
const tiles = LEVELS.flatMap(tilesForLevel);
let cursor = 0; let done = 0; let failed = 0;
const manifest = { version: 1, survey: "CDS/P/DSS2/color", format: "jpg", levels: LEVELS, generatedAt: new Date().toISOString(), tiles };
async function worker() {
  while (true) {
    const index = cursor++;
    if (index >= tiles.length) return;
    const tile = tiles[index];
    try { const result = await download(tile); done += 1; console.log(`[${done}/${tiles.length}] ${result} ${tile.key}`); }
    catch (error) { failed += 1; console.error(error.message); }
  }
}
if (!DRY_RUN) await Promise.all(Array.from({ length: Math.min(CONCURRENCY, tiles.length) }, worker));
if (failed) throw new Error(`${failed} texture non scaricate`);
await writeFile(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`Sky pack pronto: ${tiles.length} texture${DRY_RUN ? " (dry run)" : `, concorrenza ${CONCURRENCY}`}`);
