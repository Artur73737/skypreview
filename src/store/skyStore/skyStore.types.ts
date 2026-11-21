import type { SearchHit } from "../../services/catalog";
import type { SolarSelection } from "../../services/solarSystem";

export interface ObserverState {
  latDeg: number;
  lonDegEast: number;
  dateIso: string;
  live: boolean;
}

export interface OpticsState {
  model: string;
  focalMm: number;
  apertureMm: number;
  barlow: number;
}

export interface CameraState {
  model: string;
  resXpx: number;
  resYpx: number;
  pixelUm: number;
}

export interface FovBox {
  id: string;
  label: string;
  raHours: number;
  decDeg: number;
  widthDeg: number;
  heightDeg: number;
}

export type PanelId =
  | "settings"
  | "search"
  | "view"
  | "optics"
  | "camera"
  | "fov"
  | "location"
  | "object";

export interface SkyState {
  viewAltDeg: number;
  viewAzDeg: number;
  fovDeg: number;
  showEqGrid: boolean;
  showAzGrid: boolean;
  showConstellations: boolean;
  showStars: boolean;
  showStarNames: boolean;
  showDso: boolean;
  showDsoNames: boolean;
  showCardinal: boolean;
  showHorizon: boolean;
  showBackground: boolean;
  hdPhotos: boolean;
  showSolarSystem: boolean;
  observer: ObserverState;
  optics: OpticsState;
  camera: CameraState;
  fovs: FovBox[];
  selected: SearchHit | SolarSelection | null;
  quality: import("./imageQuality").ImageQuality;
  activePanel: PanelId | null;
}
