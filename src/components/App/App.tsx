import { CameraPanel } from "../CameraPanel";
import { DisplayControls } from "../DisplayControls";
import { Dock } from "../Dock";
import { FovPanel } from "../FovPanel";
import { LocationPanel } from "../LocationPanel";
import { ObjectDetail } from "../ObjectDetail";
import { OpticsPanel } from "../OpticsPanel";
import { SearchPanel } from "../SearchPanel";
import { SkyView } from "../SkyView";
import { useSkyStore, SkyStoreProvider } from "../../store/skyStore";
import { useObserver } from "../../hooks/useObserver";

const TITLES = {
  search: "Ricerca oggetti",
  view: "Layer della mappa",
  optics: "Telescopio e Barlow",
  camera: "Camera",
  fov: "Campo inquadrato",
  location: "Posizione",
  object: "Oggetto",
} as const;

function Layout() {
  const { sky, catalogs, catalogLoading, catalogError, setPanel } = useSkyStore();
  const obs = useObserver(sky.observer.latDeg, sky.observer.lonDegEast, sky.observer.dateIso);
  return (
    <div className="app">
      <main className="viewport">
        <SkyView />
        {sky.activePanel && (
          <aside className="panel">
            <div className="panel-head">
              <span>{TITLES[sky.activePanel]}</span>
              <button className="panel-close" onClick={() => setPanel(null)} aria-label="Chiudi">
                ×
              </button>
            </div>
            <div className="panel-body">
              {sky.activePanel === "search" && <SearchPanel />}
              {sky.activePanel === "view" && <DisplayControls />}
              {sky.activePanel === "optics" && <OpticsPanel />}
              {sky.activePanel === "camera" && <CameraPanel />}
              {sky.activePanel === "fov" && <FovPanel />}
              {sky.activePanel === "location" && <LocationPanel />}
              {sky.activePanel === "object" && <ObjectDetail />}
            </div>
          </aside>
        )}
      </main>
      <header className="topbar">
        <div>
          <div className="title">SkyPreview</div>
          <div className="subtitle">
            {catalogLoading && "Scarico cataloghi reali..."}
            {catalogError && `Errore cataloghi: ${catalogError}`}
            {!catalogLoading && !catalogError && catalogs && (
              <>
                {catalogs.stars.length.toLocaleString("it")} stelle ·{" "}
                {catalogs.dso.length.toLocaleString("it")} DSO ·{" "}
                {catalogs.constellations.length} costellazioni
              </>
            )}
          </div>
        </div>
        <div className="status">
          {sky.fovDeg < 10 ? sky.fovDeg.toFixed(1) : sky.fovDeg.toFixed(0)}° · LST{" "}
          {obs.lstHours.toFixed(2)}h · {sky.observer.latDeg.toFixed(1)}°{" "}
          {sky.observer.lonDegEast.toFixed(1)}°
        </div>
      </header>
      <Dock />
      <footer className="credits">
        HYG · OpenNGC CC-BY-SA · Stellarium · DSS2 CDS · ESO/S. Brunier
      </footer>
    </div>
  );
}

export function App() {
  return (
    <SkyStoreProvider>
      <Layout />
    </SkyStoreProvider>
  );
}
