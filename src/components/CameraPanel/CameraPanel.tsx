import { useMemo, useState } from "react";
import { CAMERA_PRESETS, type CameraPreset } from "../../data/equipment";
import { sensorSizeMm } from "../../services/fov";
import { useSkyStore } from "../../store/skyStore";
import { NumberField } from "../NumberField/NumberField";

export function CameraPanel() {
  const { sky, update } = useSkyStore();
  const cam = sky.camera;
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => CAMERA_PRESETS.filter(c => `${c.brand} ${c.name}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const set = (patch: Partial<typeof cam>) => update({ camera: { ...cam, ...patch } });
  const choose = (preset: CameraPreset) => set({ model: preset.name, resXpx: preset.resXpx, resYpx: preset.resYpx, pixelUm: preset.pixelUm });
  return <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
    <div style={sectionTitle}>Picker rapido · {CAMERA_PRESETS.length} camere</div>
    <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cerca ASI585, 2600, SV605…" aria-label="Cerca camera" style={input} />
    <div style={pickerList} role="listbox" aria-label="Preset camere">
      {filtered.map(p => <button key={p.id} onClick={() => choose(p)} style={pickerRow(cam.model === p.name)}>
        <span><b>{p.name}</b> <small>{p.brand}</small></span>
        <span>{p.resXpx}×{p.resYpx} · {p.pixelUm} µm · {p.price}</span>
      </button>)}
    </div>
    <div style={sectionTitle}>Parametri personalizzati · {cam.model}</div>
    <NumberField label="Risoluzione X (pixel)" integer value={cam.resXpx} onChange={resXpx => set({ model: "Personalizzata", resXpx })} />
    <NumberField label="Risoluzione Y (pixel)" integer value={cam.resYpx} onChange={resYpx => set({ model: "Personalizzata", resYpx })} />
    <NumberField label="Dimensione pixel (µm)" value={cam.pixelUm} onChange={pixelUm => set({ model: "Personalizzata", pixelUm })} />
    <p style={hint}>Sensore {sensorSizeMm(cam.resXpx, cam.pixelUm).toFixed(2)} × {sensorSizeMm(cam.resYpx, cam.pixelUm).toFixed(2)} mm</p>
  </div>;
}
const sectionTitle: React.CSSProperties = { fontSize: 12, textTransform: "uppercase", letterSpacing: ".06em", color: "#94a3b8" };
const input: React.CSSProperties = { width: "100%", padding: "9px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,.16)", background: "rgba(255,255,255,.08)", color: "#f8fafc" };
const pickerList: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 4, maxHeight: 260, overflowY: "auto" };
const pickerRow = (active: boolean): React.CSSProperties => ({ display: "flex", flexDirection: "column", gap: 3, textAlign: "left", padding: "8px 9px", borderRadius: 9, border: active ? "1px solid #38bdf8" : "1px solid transparent", background: active ? "rgba(56,189,248,.15)" : "rgba(255,255,255,.05)", color: "#e2e8f0", cursor: "pointer", fontSize: 12 });
const hint: React.CSSProperties = { color: "#94a3b8", fontSize: 12, margin: 0 };
