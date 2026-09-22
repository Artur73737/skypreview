import type { SearchHit } from "../../services/catalog";

export interface ObserverState {
  latDeg: number;
  lonDegEast: number;
  dateIso: string;
  live: boolean;
}

export interface OpticsState {
  focalMm: number;
  apertureMm: number;
  barlow: number;
}

export interface CameraState {
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
  observer: ObserverState;
  optics: OpticsState;
  camera: CameraState;
  fovs: FovBox[];
  selected: SearchHit | null;
  activePanel: PanelId | null;
}
