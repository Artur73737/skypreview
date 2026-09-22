import type { PanelId } from "../../store/skyStore";
import { useSkyStore } from "../../store/skyStore";

const ITEMS: { id: PanelId; label: string }[] = [
  { id: "search", label: "Cerca" },
  { id: "view", label: "Layer" },
  { id: "optics", label: "Ottica" },
  { id: "camera", label: "Camera" },
  { id: "fov", label: "FOV" },
  { id: "location", label: "Luogo" },
  { id: "object", label: "Oggetto" },
];

export function Dock() {
  const { sky, setPanel } = useSkyStore();
  return (
    <nav className="dock" aria-label="Opzioni cielo">
      {ITEMS.map((item) => {
        const active = sky.activePanel === item.id;
        return (
          <button
            key={item.id}
            className={active ? "dock-item dock-item-active" : "dock-item"}
            onClick={() => setPanel(item.id)}
          >
            {item.label}
            {item.id === "fov" && sky.fovs.length > 0 && (
              <span className="dock-badge">{sky.fovs.length}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
