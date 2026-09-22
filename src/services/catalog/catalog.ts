export interface StarEntry {
  hip: number | null;
  name: string;
  raHours: number;
  decDeg: number;
  mag: number;
  bv: number;
}

export interface DsoEntry {
  id: string;
  messier: string | null;
  type: string;
  raHours: number;
  decDeg: number;
  mag: number | null;
  sizeArcmin: [number | null, number | null];
  constellation: string | null;
  commonNames: string | null;
}

export interface ConstellationEntry {
  iau: string;
  name: string;
  english: string | null;
  lines: [number, number][][];
}

export interface CatalogBundle {
  stars: StarEntry[];
  dso: DsoEntry[];
  constellations: ConstellationEntry[];
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Catalogo non caricato: ${url} (${res.status})`);
  return res.json() as Promise<T>;
}

export async function loadCatalogs(base = import.meta.env.BASE_URL.replace(/\/$/, "")): Promise<CatalogBundle> {
  const [stars, dso, constellations] = await Promise.all([
    fetchJson<StarEntry[]>(`${base}/data/stars.json`),
    fetchJson<DsoEntry[]>(`${base}/data/dso.json`),
    fetchJson<ConstellationEntry[]>(`${base}/data/constellations.json`),
  ]);
  return { stars, dso, constellations };
}

export interface SearchHit {
  kind: "star" | "dso";
  label: string;
  sub: string;
  raHours: number;
  decDeg: number;
  mag: number | null;
  ref: StarEntry | DsoEntry;
}

export function searchCatalogs(
  bundle: CatalogBundle,
  query: string,
  limit = 12,
): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const hits: SearchHit[] = [];
  const norm = (s: string) => s.toLowerCase();
  for (const s of bundle.stars) {

    if (norm(s.name).includes(q)) {
      hits.push({
        kind: "star",
        label: s.name,
        sub: `Stella mag ${s.mag.toFixed(1)}`,
        raHours: s.raHours,
        decDeg: s.decDeg,
        mag: s.mag,
        ref: s,
      });
    }
  }
  for (const d of bundle.dso) {

    const hay = `${d.id} ${d.messier ?? ""} ${d.commonNames ?? ""}`.toLowerCase();
    const compact = q.replace(/\s+/g, "");
    const idCompact = d.id.toLowerCase().replace(/\s+/g, "");
    const mCompact = (d.messier ?? "").toLowerCase().replace(/\s+/g, "");
    if (hay.includes(q) || idCompact === compact || mCompact === compact) {
      const label = d.messier ? `${d.messier} · ${d.id}` : d.id;
      hits.push({
        kind: "dso",
        label,
        sub: `${d.type} mag ${d.mag ?? "?"} · ${d.commonNames ?? d.constellation ?? ""}`,
        raHours: d.raHours,
        decDeg: d.decDeg,
        mag: d.mag,
        ref: d,
      });
    }

  }
  const compact = q.replace(/\s+/g, "");
  const rank = (hit: SearchHit) => {
    const ids = hit.kind === "dso" ? [(hit.ref as DsoEntry).id, (hit.ref as DsoEntry).messier ?? ""] : [hit.label];
    return ids.some(id => id.toLowerCase().replace(/\s+/g, "") === compact) ? 0 : 1;
  };
  return hits.sort((a, b) => rank(a) - rank(b) || (a.mag ?? 99) - (b.mag ?? 99)).slice(0, limit);
}
