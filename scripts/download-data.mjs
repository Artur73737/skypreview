// Scarica i cataloghi reali e li converte in JSON leggeri per il viewer.
// Sorgenti: HYG v3 (stelle), OpenNGC (deep sky), Stellarium western (costellazioni), ESO (Via Lattea).
// Esegui con: npm run download:data
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DATA = join(ROOT, "public", "data");
const OUT_SURVEY = join(ROOT, "public", "surveys");

const HYG_URL = "https://raw.githubusercontent.com/kiloquad/__HYG-Database/master/hygdata_v3.csv";
const NGC_URL = "https://raw.githubusercontent.com/mattiaverga/OpenNGC/master/database_files/NGC.csv";
const ADD_URL =
  "https://raw.githubusercontent.com/mattiaverga/OpenNGC/master/database_files/addendum.csv";
const WESTERN_URL =
  "https://raw.githubusercontent.com/Stellarium/stellarium-skycultures/master/western/index.json";
const MILKYWAY_URL = "https://cdn.eso.org/images/large/eso0932a.jpg";

const STAR_MAG_LIMIT = 7.0;
const DSO_MAG_LIMIT = 14.0;

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else inQ = !inQ;
    } else if (c === "," && !inQ) {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

function raHmsToHours(hms) {
  const parts = hms.trim().split(":");
  if (parts.length < 3) return null;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  const s = Number(parts[2]);
  if (!Number.isFinite(h) || !Number.isFinite(m) || !Number.isFinite(s)) return null;
  return h + m / 60 + s / 3600;
}

function decDmsToDeg(dms) {
  const t = dms.trim();
  const sign = t.startsWith("-") ? -1 : 1;
  const clean = t.replace(/^[+-]/, "");
  const parts = clean.split(":");
  if (parts.length < 3) return null;
  const d = Number(parts[0]);
  const m = Number(parts[1]);
  const s = Number(parts[2]);
  if (!Number.isFinite(d) || !Number.isFinite(m) || !Number.isFinite(s)) return null;
  return sign * (d + m / 60 + s / 3600);
}

function starDisplayName(row) {
  if (row.proper) return row.proper;
  const bayer = (row.bayer ?? "").trim();
  const flam = (row.flam ?? "").trim();
  const con = (row.con ?? "").trim();
  if (bayer && flam && con) return `${bayer} ${flam} ${con}`;
  if (bayer && con) return `${bayer} ${con}`;
  if (flam && con) return `${flam} ${con}`;
  if (row.gl) return row.gl;
  if (row.bf) return row.bf;
  if (row.hd) return `HD ${row.hd}`;
  if (row.hip) return `HIP ${row.hip}`;
  return `HYG ${row.id}`;
}

async function downloadStars() {
  const res = await fetch(HYG_URL);
  if (!res.ok) throw new Error(`HYG download fallito: ${res.status}`);
  const text = await res.text();
  const lines = text.split("\n");
  const header = parseCsvLine(lines[0]).map((h) => h.trim());
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  const hipMap = new Map();
  const stars = [];
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim()) continue;
    const cols = parseCsvLine(line);
    const mag = Number(cols[idx.mag]);
    const raSourceHours = Number(cols[idx.ra]);
    const decDeg = Number(cols[idx.dec]);
    if (!Number.isFinite(raSourceHours) || !Number.isFinite(decDeg)) continue;
    const hip = Number(cols[idx.hip]);
    const proper = (cols[idx.proper] ?? "").trim();
    if (proper === "Sol") continue;
    const raHours = ((raSourceHours % 24) + 24) % 24;
    if (Number.isFinite(hip) && hip > 0) hipMap.set(hip, [raHours, decDeg]);
    if (!Number.isFinite(mag) || mag > STAR_MAG_LIMIT) continue;
    stars.push({
      hip: Number.isFinite(hip) && hip > 0 ? hip : null,
      name: starDisplayName({
        proper: (cols[idx.proper] ?? "").trim(),
        bayer: cols[idx.bayer] ?? "",
        flam: cols[idx.flam] ?? "",
        con: cols[idx.con] ?? "",
        gl: (cols[idx.gl] ?? "").trim(),
        bf: (cols[idx.bf] ?? "").trim(),
        hd: (cols[idx.hd] ?? "").trim(),
        hip: (cols[idx.hip] ?? "").trim(),
        id: (cols[idx.id] ?? "").trim(),
      }),
      raHours: Math.round(raHours * 1e5) / 1e5,
      decDeg: Math.round(decDeg * 1e4) / 1e4,
      mag: Math.round(mag * 100) / 100,
      bv: Number.isFinite(Number(cols[idx.ci])) ? Math.round(Number(cols[idx.ci]) * 100) / 100 : 0,
    });
  }
  stars.sort((a, b) => a.mag - b.mag);
  return { stars, hipMap };
}

function parseOpenNgc(text) {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const header = lines[0].split(";").map((h) => h.trim());
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = lines[i].split(";");
    const get = (k) => (cols[idx[k]] ?? "").trim();
    rows.push({ get });
  }
  return rows;
}

const SKIP_TYPES = new Set(["Dup", "NonEx", "Other", "*Ass", "GPair", "GTrpl"]);

function toDsoEntry(get) {
  const name = get("Name");
  const type = get("Type");
  if (!name || SKIP_TYPES.has(type)) return null;
  const raHours = raHmsToHours(get("RA"));
  const decDeg = decDmsToDeg(get("Dec"));
  if (raHours === null || decDeg === null) return null;
  const messierRaw = get("M").trim();
  const messier = messierRaw ? `M${Number.parseInt(messierRaw, 10)}` : null;
  const vMag = get("V-Mag") ? Number(get("V-Mag")) : NaN;
  const bMag = get("B-Mag") ? Number(get("B-Mag")) : NaN;
  const mag = Number.isFinite(vMag) ? vMag : Number.isFinite(bMag) ? bMag : NaN;
  if (!messier && (!Number.isFinite(mag) || mag > DSO_MAG_LIMIT)) return null;
  const maj = Number(get("MajAx"));
  const min = Number(get("MinAx"));
  return {
    id: name,
    messier,
    type,
    raHours: Math.round(raHours * 1e5) / 1e5,
    decDeg: Math.round(decDeg * 1e4) / 1e4,
    mag: Number.isFinite(mag) ? Math.round(mag * 100) / 100 : null,
    sizeArcmin: [
      Number.isFinite(maj) && maj > 0 ? Math.round(maj * 100) / 100 : null,
      Number.isFinite(min) && min > 0 ? Math.round(min * 100) / 100 : null,
    ],
    constellation: get("Const") || null,
    commonNames: get("Common names") || null,
  };
}

async function downloadDso() {
  const [ngcRes, addRes] = await Promise.all([fetch(NGC_URL), fetch(ADD_URL)]);
  if (!ngcRes.ok) throw new Error(`OpenNGC NGC fallito: ${ngcRes.status}`);
  if (!addRes.ok) throw new Error(`OpenNGC addendum fallito: ${addRes.status}`);
  const entries = new Map();
  for (const text of [await ngcRes.text(), await addRes.text()]) {
    for (const { get } of parseOpenNgc(text)) {
      const entry = toDsoEntry(get);
      if (entry && !entries.has(entry.id)) entries.set(entry.id, entry);
    }
  }
  return [...entries.values()].sort((a, b) => {
    if (a.messier && !b.messier) return -1;
    if (!a.messier && b.messier) return 1;
    return (a.mag ?? 99) - (b.mag ?? 99);
  });
}

async function downloadConstellations(hipMap) {
  const res = await fetch(WESTERN_URL);
  if (!res.ok) throw new Error(`Stellarium western fallito: ${res.status}`);
  const data = await res.json();
  const out = [];
  for (const c of data.constellations ?? []) {
    const lines = [];
    for (const path of c.lines ?? []) {
      const pts = [];
      for (const hip of path) {
        if (typeof hip === "string") continue;
        const coord = hipMap.get(hip);
        if (coord) pts.push([Math.round(coord[0] * 1e4) / 1e4, Math.round(coord[1] * 1e3) / 1e3]);
      }
      if (pts.length >= 2) lines.push(pts);
    }
    if (lines.length === 0) continue;
    out.push({
      iau: c.iau ?? c.id,
      name: c.common_name?.native ?? c.iau ?? c.id,
      english: c.common_name?.english ?? null,
      lines,
    });
  }
  return out;
}

async function downloadMilkyWay() {
  const res = await fetch(MILKYWAY_URL);
  if (!res.ok) throw new Error(`ESO Milky Way fallita: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 500_000) throw new Error("ESO immagine troppo piccola, download corrotto");
  writeFileSync(join(OUT_SURVEY, "milkyway.jpg"), buf);
  return { bytes: buf.length, url: MILKYWAY_URL };
}

async function downloadAllSky() {
  const url = "https://alasky.cds.unistra.fr/hips-image-services/hips2fits?hips=CDS%2FP%2FDSS2%2Fcolor&width=2048&height=1024&ra=180&dec=0&fov=360&projection=CAR&coordsys=icrs&format=jpg";
  const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`DSS2 all-sky: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) throw new Error("DSS2 all-sky: JPEG non valido");
  writeFileSync(join(OUT_SURVEY, "dss2-allsky.jpg"), buffer);
  return { url, license: "DSS2 / STScI, HiPS2FITS CDS Strasbourg" };
}

async function main() {
  mkdirSync(OUT_DATA, { recursive: true });
  mkdirSync(OUT_SURVEY, { recursive: true });
  console.log("Download HYG stelle...");
  const { stars, hipMap } = await downloadStars();
  console.log(`Stelle mag<=${STAR_MAG_LIMIT}: ${stars.length}`);
  console.log("Download OpenNGC...");
  const dso = await downloadDso();
  console.log(`DSO filtrati: ${dso.length}`);
  console.log("Download costellazioni Stellarium...");
  const constellations = await downloadConstellations(hipMap);
  console.log(`Costellazioni: ${constellations.length}`);
  console.log("Download ESO Milky Way...");
  const mw = await downloadMilkyWay();
  console.log(`Milky Way: ${(mw.bytes / 1048576).toFixed(1)} MB`);
  const dss2 = await downloadAllSky();
  writeFileSync(join(OUT_DATA, "stars.json"), JSON.stringify(stars));
  writeFileSync(join(OUT_DATA, "dso.json"), JSON.stringify(dso));
  writeFileSync(join(OUT_DATA, "constellations.json"), JSON.stringify(constellations));
  writeFileSync(
    join(OUT_DATA, "metadata.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        starMagLimit: STAR_MAG_LIMIT,
        dsoMagLimit: DSO_MAG_LIMIT,
        counts: { stars: stars.length, dso: dso.length, constellations: constellations.length },
        sources: {
          dss2,
          stars: { url: HYG_URL, license: "HYG DB (Hipparcos+Yale+Gliese), uso con attribuzione" },
          dso: { url: NGC_URL, license: "OpenNGC CC-BY-SA-4.0, Mattia Verga" },
          constellations: { url: WESTERN_URL, license: "Stellarium GPL-2.0, IAU western" },
          milkyway: { url: mw.url, license: "ESO/S. Brunier CC BY 4.0, eso0932a" },
        },
      },
      null,
      2,
    ),
  );
  console.log("Fatto. File in public/data + public/surveys/milkyway.jpg");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
