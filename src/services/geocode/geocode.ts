export interface CityResult {
  name: string;
  latDeg: number;
  lonDegEast: number;
}

export async function searchCity(query: string): Promise<CityResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const params = new URLSearchParams({ format: "jsonv2", limit: "6", q });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Ricerca luogo fallita (${res.status})`);
  const rows = (await res.json()) as { display_name: string; lat: string; lon: string }[];
  return rows
    .map((r) => ({
      name: r.display_name,
      latDeg: Number(r.lat),
      lonDegEast: Number(r.lon),
    }))
    .filter((r) => Number.isFinite(r.latDeg) && Number.isFinite(r.lonDegEast));
}
