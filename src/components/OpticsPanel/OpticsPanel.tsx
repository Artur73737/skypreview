import { useMemo, useState } from "react";
import { TELESCOPE_PRESETS, type TelescopePreset } from "../../data/equipment";
import { useSkyStore } from "../../store/skyStore";
import { NumberField } from "../NumberField/NumberField";
export function OpticsPanel() {
  const { sky, update } = useSkyStore(); const optics = sky.optics; const [query, setQuery] = useState("");
  const filtered = useMemo(() => TELESCOPE_PRESETS.filter(t => `${t.brand} ${t.name} ${t.type}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const set = (patch: Partial<typeof optics>) => update({ optics: { ...optics, ...patch } });
  const choose = (p: TelescopePreset) => {
    const camera = p.integratedCamera;
    update({
      optics: {
        ...optics,
        model: p.name,
        focalMm: p.focalMm,
        apertureMm: p.apertureMm,
        barlow: camera ? 1 : optics.barlow,
      },
      ...(camera
        ? { camera: { model: camera.model, resXpx: camera.resXpx, resYpx: camera.resYpx, pixelUm: camera.pixelUm } }
        : {}),
    });
  };
  const eff = optics.focalMm * optics.barlow;
  return <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
    <div style={sectionTitle}>Presets · {TELESCOPE_PRESETS.length} telescopes</div>
    <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search Askar, C8, 150/750…" aria-label="Search telescopeso" style={input} />
    <div style={pickerList} role="group" aria-label="Preset telescopes">
      {filtered.map(p => <button key={p.id} aria-pressed={optics.model === p.name} onClick={() => choose(p)} style={pickerRow(optics.model === p.name)}>
        <span><b>{p.name}</b> <small>{p.brand}</small></span>
        <span>{p.apertureMm} mm · {p.focalMm} mm · {p.focalRatio} · {p.resolutionArcsec.toFixed(2)}″{p.integratedCamera ? " · integrated camera" : ""}</span>
      </button>)}
    </div>
    <div style={sectionTitle}>Manual settings · {optics.model}</div>
    <NumberField label="Focal length (mm)" value={optics.focalMm} onChange={focalMm => set({ model: "Custom", focalMm })} />
    <NumberField label="Aperture (mm)" value={optics.apertureMm} onChange={apertureMm => set({ model: "Custom", apertureMm })} />
    <NumberField label="Barlow / reducer factor" value={optics.barlow} onChange={barlow => set({ barlow })} />
    <p style={hint}>1 = no multiplier · 0.7 = reducer · 2 = Barlow 2×</p>
    <p style={hint}>Effective focal length {eff.toLocaleString("en")} mm · f/{(eff / optics.apertureMm).toFixed(2)}</p>
  </div>;
}
const sectionTitle: React.CSSProperties = { fontSize: 12, textTransform: "uppercase", letterSpacing: ".06em", color: "#94a3b8" };
const input: React.CSSProperties = { width: "100%", padding: "9px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,.16)", background: "rgba(255,255,255,.08)", color: "#f8fafc" };
const pickerList: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 4, maxHeight: 300, overflowY: "auto" };
const pickerRow = (active: boolean): React.CSSProperties => ({ display: "flex", flexDirection: "column", gap: 3, textAlign: "left", padding: "8px 9px", borderRadius: 9, border: active ? "1px solid #38bdf8" : "1px solid transparent", background: active ? "rgba(56,189,248,.15)" : "rgba(255,255,255,.05)", color: "#e2e8f0", cursor: "pointer", fontSize: 12 });
const hint: React.CSSProperties = { color: "#94a3b8", fontSize: 12, margin: 0 };
