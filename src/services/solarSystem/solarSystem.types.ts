import type { Body } from "astronomy-engine";

export type SolarBodyId =
  | "moon"
  | "mercury"
  | "venus"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune";

export interface SolarBodyDefinition {
  id: SolarBodyId;
  body: Body;
  label: string;
  englishName: string;
  aliases: string[];
  texture: string;
  color: string;
  radiusKm: number;
  kind: "moon" | "planet";
}

export interface SolarBodySnapshot {
  id: SolarBodyId;
  label: string;
  englishName: string;
  raHours: number;
  decDeg: number;
  altDeg: number;
  azDeg: number;
  distanceAu: number;
  distanceKm: number;
  angularDiameterDeg: number;
  phaseFraction: number;
  phaseAngleDeg: number;
  magnitude: number;
  ringTiltDeg: number | null;
  definition: SolarBodyDefinition;
}

export interface SunSnapshot {
  raHours: number;
  decDeg: number;
  altDeg: number;
  azDeg: number;
}

export interface SolarSystemSnapshot {
  bodies: SolarBodySnapshot[];
  sun: SunSnapshot;
}

export interface SolarSelection {
  kind: "solar";
  label: string;
  sub: string;
  raHours: number;
  decDeg: number;
  mag: number | null;
  ref: SolarBodyDefinition;
}

export interface SolarTextures {
  images: Partial<Record<SolarBodyId, HTMLImageElement>>;
  ringAlpha: HTMLImageElement | null;
}
