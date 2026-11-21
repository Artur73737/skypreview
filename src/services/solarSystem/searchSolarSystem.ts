import type {
  SolarSelection,
  SolarSystemSnapshot,
} from "./solarSystem.types";

export function searchSolarBodies(
  query: string,
  snapshot: SolarSystemSnapshot,
): SolarSelection[] {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < 2) return [];
  return snapshot.bodies
    .filter((body) => {
      const haystack = `${body.label} ${body.englishName} ${body.definition.aliases.join(" ")}`;
      return haystack.toLowerCase().includes(normalized);
    })
    .map((body) => ({
      kind: "solar" as const,
      label: body.label,
      sub: `${body.definition.kind === "moon" ? "Satellite" : "Planet"} · magnitude ${body.magnitude.toFixed(1)} · altitude ${body.altDeg.toFixed(1)}°`,
      raHours: body.raHours,
      decDeg: body.decDeg,
      mag: body.magnitude,
      ref: body.definition,
    }));
}
