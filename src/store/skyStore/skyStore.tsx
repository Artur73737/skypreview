import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CatalogBundle } from "../../services/catalog";
import { loadCatalogs } from "../../services/catalog";
import type { PanelId, SkyState } from "./skyStore.types";

interface SkyStoreValue {
  sky: SkyState;
  catalogs: CatalogBundle | null;
  catalogError: string | null;
  catalogLoading: boolean;
  update: (patch: Partial<SkyState>) => void;
  setPanel: (panel: PanelId | null) => void;
}

const DEFAULT_STATE: SkyState = {
  viewAltDeg: 35,
  viewAzDeg: 180,
  fovDeg: 75,
  showEqGrid: false,
  showAzGrid: false,
  showConstellations: true,
  showStars: true,
  showStarNames: false,
  showDso: false,
  showDsoNames: false,
  showCardinal: true,
  showHorizon: true,
  showBackground: true,
  hdPhotos: true,
  observer: {
    latDeg: Number(import.meta.env.VITE_DEFAULT_LAT ?? 45.4642),
    lonDegEast: Number(import.meta.env.VITE_DEFAULT_LON ?? 9.19),
    dateIso: new Date().toISOString(),
    live: true,
  },
  optics: { model: "Personalizzato", focalMm: 750, apertureMm: 150, barlow: 1 },
  camera: { model: "Personalizzata", resXpx: 6000, resYpx: 4000, pixelUm: 3.76 },
  fovs: [],
  selected: null,
  activePanel: null,
};

const SETTINGS_KEY = "skypreview.settings.v2";
const LAYERS = ["showStars", "showStarNames", "showDso", "showDsoNames", "showConstellations", "showEqGrid", "showAzGrid", "showHorizon", "showCardinal", "showBackground", "hdPhotos"] as const;
function initialState(): SkyState {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "null");
    if (!saved) return DEFAULT_STATE;
    const state = { ...DEFAULT_STATE, optics: { ...DEFAULT_STATE.optics }, camera: { ...DEFAULT_STATE.camera } };
    for (const key of LAYERS) if (typeof saved[key] === "boolean") state[key] = saved[key];
    for (const group of ["optics", "camera"] as const) {
      for (const key of Object.keys(state[group])) {
        const value = saved[group]?.[key];
        if (typeof value === "number" && Number.isFinite(value) && value > 0 && (!key.startsWith("res") || Number.isInteger(value)))
          (state[group] as unknown as Record<string, number>)[key] = value;
      }
    }
    return state;
  } catch { return DEFAULT_STATE; }
}

const SkyStoreContext = createContext<SkyStoreValue | null>(null);

export function SkyStoreProvider({ children }: { children: ReactNode }) {
  const [sky, setSky] = useState<SkyState>(initialState);
  const [catalogs, setCatalogs] = useState<CatalogBundle | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadCatalogs()
      .then((bundle) => {
        if (!cancelled) {
          setCatalogs(bundle);
          setCatalogLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setCatalogError(err instanceof Error ? err.message : String(err));
          setCatalogLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sky.observer.live) return;
    const timer = window.setInterval(() => {
      setSky((prev) => ({
        ...prev,
        observer: { ...prev.observer, dateIso: new Date().toISOString() },
      }));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [sky.observer.live]);

  const settings = JSON.stringify({ optics: sky.optics, camera: sky.camera, ...Object.fromEntries(LAYERS.map(key => [key, sky[key]])) });
  useEffect(() => { try { localStorage.setItem(SETTINGS_KEY, settings); } catch { /* Storage can be unavailable. */ } }, [settings]);

  const update = useCallback((patch: Partial<SkyState>) => {
    setSky((prev) => ({ ...prev, ...patch }));
  }, []);

  const setPanel = useCallback(
    (panel: PanelId | null) => {
      setSky((prev) => ({ ...prev, activePanel: prev.activePanel === panel ? null : panel }));
    },
    [],
  );

  const value = useMemo(
    () => ({ sky, catalogs, catalogError, catalogLoading, update, setPanel }),
    [sky, catalogs, catalogError, catalogLoading, update, setPanel],
  );
  return <SkyStoreContext.Provider value={value}>{children}</SkyStoreContext.Provider>;
}

export function useSkyStore(): SkyStoreValue {
  const ctx = useContext(SkyStoreContext);
  if (!ctx) throw new Error("useSkyStore fuori dal provider");
  return ctx;
}
