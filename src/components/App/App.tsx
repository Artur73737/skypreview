import { useEffect, useRef, type PointerEvent } from "react";
import { QualitySettings } from "../DisplayControls/QualitySettings";
import { DisplayControls } from "../DisplayControls";
import { Dock } from "../Dock";
import { FovPanel } from "../FovPanel";
import { LocationPanel } from "../LocationPanel";
import { ObjectDetail } from "../ObjectDetail";
import { SearchPanel } from "../SearchPanel";
import { SkyView } from "../SkyView";
import { useSkyStore, SkyStoreProvider } from "../../store/skyStore";

const TOOLS = {
  settings: { title: "Image settings", View: QualitySettings },
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

  const drag = useRef<{ id: number; offsetX: number; offsetY: number } | null>(null);
  const backdropPointer = useRef<number | null>(null);

  const moveDialog = (left: number, top: number) => {
    const element = dialog.current;
    if (!element?.open) return;
    const { width, height } = element.getBoundingClientRect();
    const root = document.documentElement;
    Object.assign(element.style, {
      margin: "0",
      right: "auto",
      bottom: "auto",
      left: `${Math.max(0, Math.min(left, root.clientWidth - width))}px`,
      top: `${Math.max(0, Math.min(top, root.clientHeight - height))}px`,
    });
  };

  const startDrag = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0 ||
        (event.target as Element).closest("button")) return;
    const rect = dialog.current?.getBoundingClientRect();
    if (!rect) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { id: event.pointerId, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
  };

  const outside = (event: PointerEvent<HTMLDialogElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return event.target === event.currentTarget &&
      (event.clientX < rect.left || event.clientX >= rect.right ||
       event.clientY < rect.top || event.clientY >= rect.bottom);
  };

  useEffect(() => {
    const element = dialog.current;
    if (tool && element && !element.open) element.showModal();
    if (!tool && element?.open) {
      element.close();
      element.removeAttribute("style");
      drag.current = null;
      backdropPointer.current = null;
    }
    if (!tool || !element) return;
    const keepInView = () => {
      if (element.style.left) {
        const rect = element.getBoundingClientRect();
        moveDialog(rect.left, rect.top);
      }
    };
    const observer = new ResizeObserver(keepInView);
    observer.observe(element);
    window.addEventListener("resize", keepInView);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", keepInView);
    };
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
        onPointerDown={event => {
          if (event.isPrimary && event.button === 0)
            backdropPointer.current = outside(event) ? event.pointerId : null;
        }}
        onPointerUp={event => {
          if (backdropPointer.current !== event.pointerId) return;
          backdropPointer.current = null;
          if (outside(event)) setPanel(null);
        }}
        onPointerCancel={() => { backdropPointer.current = null; }}>
        {tool && <div className="dialog-content">
          <header className="panel-head"
            onPointerDown={startDrag}
            onPointerMove={event => {
              const active = drag.current;
              if (active?.id === event.pointerId)
                moveDialog(event.clientX - active.offsetX, event.clientY - active.offsetY);
            }}
            onLostPointerCapture={event => {
              if (drag.current?.id === event.pointerId) drag.current = null;
            }}>
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
