import { useEffect, useRef } from "react";
import { DisplayControls } from "../DisplayControls";
import { Dock } from "../Dock";
import { FovPanel } from "../FovPanel";
import { LocationPanel } from "../LocationPanel";
import { ObjectDetail } from "../ObjectDetail";
import { SearchPanel } from "../SearchPanel";
import { SkyView } from "../SkyView";
import { useSkyStore, SkyStoreProvider } from "../../store/skyStore";

const TOOLS = {
  search: { title: "Find an object", View: SearchPanel },
  view: { title: "Map layers", View: DisplayControls },
  fov: { title: "Field of view", View: FovPanel },
  location: { title: "Observer", View: LocationPanel },
  object: { title: "Object details", View: ObjectDetail },
} as const;

function Layout() {
  const { sky, catalogError, setPanel } = useSkyStore();
  const panel = sky.activePanel === "optics" || sky.activePanel === "camera" ? "fov" : sky.activePanel;
  const tool = panel ? TOOLS[panel] : null;
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (tool && element && !element.open) element.showModal();
    if (!tool && element?.open) element.close();
  }, [tool]);

  return (
    <div className="app">
      <main className="viewport" aria-label="Sky map"><SkyView /></main>
      <header className="topbar">
        <div className="title">SkyPreview</div>
        <output className="status" aria-label="Map zoom">{sky.fovDeg < 0.1 ? `${(sky.fovDeg * 3600).toFixed(1)}″` : `${sky.fovDeg.toFixed(1)}°`}</output>
      </header>
      {catalogError && <p className="catalog-error" role="alert">{catalogError}</p>}
      <Dock />
      <dialog ref={dialog} className={`tool-dialog ${panel === "fov" ? "tool-dialog-wide" : ""}`}
        aria-labelledby="tool-title"
        onCancel={event => { event.preventDefault(); setPanel(null); }}
        onClick={event => { if (event.target === event.currentTarget) setPanel(null); }}>
        {tool && <div className="dialog-content">
          <header className="panel-head">
            <h2 id="tool-title">{tool.title}</h2>
            <button onClick={() => setPanel(null)} aria-label="Close dialog">×</button>
          </header>
          <div className="panel-body"><tool.View key={panel === "object" ? sky.selected?.label : panel} /></div>
        </div>}
      </dialog>
    </div>
  );
}

export function App() {
  return <SkyStoreProvider><Layout /></SkyStoreProvider>;
}
