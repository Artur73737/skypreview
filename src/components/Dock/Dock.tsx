import type { PanelId } from "../../store/skyStore";
import { useSkyStore } from "../../store/skyStore";

const ITEMS: { id: PanelId; label: string }[] = [
  { id: "search", label: "Search" },
  { id: "view", label: "Layers" },
  { id: "fov", label: "FOV" },
  { id: "location", label: "Observer" },
  { id: "object", label: "Object" },
  { id: "settings", label: "Settings" },
];

export function Dock() {
  const { sky, setPanel } = useSkyStore();
  return (
    <nav className="dock" aria-label="Sky tools">
      {ITEMS.map((item) => {
        const active = sky.activePanel === item.id;
        return (
          <button
            key={item.id}
            className={active ? "dock-item dock-item-active" : "dock-item"}
            aria-pressed={active}
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
