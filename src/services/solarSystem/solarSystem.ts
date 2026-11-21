import {
  Body,
  Equator,
  Horizon,
  Illumination,
  KM_PER_AU,
  Observer,
} from "astronomy-engine";
import type {
  SolarBodyDefinition,
  SolarBodyId,
  SolarBodySnapshot,
  SolarSystemSnapshot,
  SunSnapshot,
} from "./solarSystem.types";

export const SOLAR_BODIES: SolarBodyDefinition[] = [
  {
    id: "moon",
    body: Body.Moon,
    label: "Luna",
    englishName: "Moon",
    aliases: ["luna", "moon"],
    texture: "2k_moon.jpg",
    color: "#e2e8f0",
    radiusKm: 1737.4,
    kind: "moon",
  },
  {
    id: "mercury",
    body: Body.Mercury,
    label: "Mercurio",
    englishName: "Mercury",
    aliases: ["mercurio", "mercury"],
    texture: "2k_mercury.jpg",
    color: "#b8b2a7",
    radiusKm: 2439.7,
    kind: "planet",
  },
  {
    id: "venus",
    body: Body.Venus,
    label: "Venere",
    englishName: "Venus",
    aliases: ["venere", "venus"],
    texture: "2k_venus_atmosphere.jpg",
    color: "#f1e2b5",
    radiusKm: 6051.8,
    kind: "planet",
  },
  {
    id: "mars",
    body: Body.Mars,
    label: "Marte",
    englishName: "Mars",
    aliases: ["marte", "mars"],
    texture: "2k_mars.jpg",
    color: "#dd8a63",
    radiusKm: 3389.5,
    kind: "planet",
  },
  {
    id: "jupiter",
    body: Body.Jupiter,
    label: "Giove",
    englishName: "Jupiter",
    aliases: ["giove", "jupiter"],
    texture: "2k_jupiter.jpg",
    color: "#d8b98a",
    radiusKm: 69911,
    kind: "planet",
  },
  {
    id: "saturn",
    body: Body.Saturn,
    label: "Saturno",
    englishName: "Saturn",
    aliases: ["saturno", "saturn"],
    texture: "2k_saturn.jpg",
    color: "#d9c48a",
    radiusKm: 58232,
    kind: "planet",
  },
  {
    id: "uranus",
    body: Body.Uranus,
    label: "Urano",
    englishName: "Uranus",
    aliases: ["urano", "uranus"],
    texture: "2k_uranus.jpg",
    color: "#a5dbe3",
    radiusKm: 25362,
    kind: "planet",
  },
  {
    id: "neptune",
    body: Body.Neptune,
    label: "Nettuno",
    englishName: "Neptune",
    aliases: ["nettuno", "neptune"],
    texture: "2k_neptune.jpg",
    color: "#7d9fdd",
    radiusKm: 24622,
    kind: "planet",
  },
];

export function solarBodyById(id: SolarBodyId): SolarBodyDefinition {
  const found = SOLAR_BODIES.find((definition) => definition.id === id);
  if (!found) throw new Error(`Corpo solare sconosciuto: ${id}`);
  return found;
}

function angularDiameterDeg(radiusKm: number, distanceKm: number): number {
  if (!(distanceKm > 0)) return 0;
  return (2 * Math.asin(Math.min(1, radiusKm / distanceKm)) * 180) / Math.PI;
}

function snapshotFor(
  definition: SolarBodyDefinition,
  date: Date,
  observer: Observer,
): SolarBodySnapshot {
  const equator = Equator(definition.body, date, observer, true, true);
  const horizontal = Horizon(date, observer, equator.ra, equator.dec);
  const illumination = Illumination(definition.body, date);
  const distanceKm = equator.dist * KM_PER_AU;

  return {
    id: definition.id,
    label: definition.label,
    englishName: definition.englishName,
    raHours: equator.ra,
    decDeg: equator.dec,
    altDeg: horizontal.altitude,
    azDeg: horizontal.azimuth,
    distanceAu: equator.dist,
    distanceKm,
    angularDiameterDeg: angularDiameterDeg(definition.radiusKm, distanceKm),
    phaseFraction: illumination.phase_fraction,
    phaseAngleDeg: illumination.phase_angle,
    magnitude: illumination.mag,
    ringTiltDeg: illumination.ring_tilt ?? null,
    definition,
  };
}

function sunSnapshot(date: Date, observer: Observer): SunSnapshot {
  const equator = Equator(Body.Sun, date, observer, true, true);
  const horizontal = Horizon(date, observer, equator.ra, equator.dec);
  return {
    raHours: equator.ra,
    decDeg: equator.dec,
    altDeg: horizontal.altitude,
    azDeg: horizontal.azimuth,
  };
}

let cachedKey = "";
let cachedSnapshot: SolarSystemSnapshot | null = null;

export function computeSolarSystem(
  date: Date,
  latDeg: number,
  lonDegEast: number,
): SolarSystemSnapshot {
  const key = `${date.getTime()}|${latDeg.toFixed(5)}|${lonDegEast.toFixed(5)}`;
  if (cachedSnapshot && cachedKey === key) return cachedSnapshot;

  const observer = new Observer(latDeg, lonDegEast, 0);
  const snapshot: SolarSystemSnapshot = {
    bodies: SOLAR_BODIES.map((definition) => snapshotFor(definition, date, observer)),
    sun: sunSnapshot(date, observer),
  };
  cachedKey = key;
  cachedSnapshot = snapshot;
  return snapshot;
}
