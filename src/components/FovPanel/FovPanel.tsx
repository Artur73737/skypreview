import { useFovSetup } from "../../hooks/useFovSetup";
import { altAzToRaDec } from "../../services/astroMath";
import { useSkyStore } from "../../store/skyStore";

export function FovPanel() {
  const { sky, update } = useSkyStore();
  const fov = useFovSetup(
    sky.optics.focalMm,
    sky.optics.apertureMm,
    sky.optics.barlow,
    sky.camera.resXpx,
    sky.camera.resYpx,
    sky.camera.pixelUm,
  );
  const theoreticalResolution = 116 / sky.optics.apertureMm;
  const addToView = () => {
    const date = new Date(sky.observer.dateIso);
    const eq = altAzToRaDec(
      sky.viewAltDeg,
      sky.viewAzDeg,
      sky.observer.latDeg,
      sky.observer.lonDegEast,
      date,
    );
    const id = `fov-${Date.now()}`;
    update({
      fovs: [
        ...sky.fovs,
        {
          id,
          label: `${sky.optics.focalMm}${sky.optics.barlow > 1 ? `×${sky.optics.barlow}` : ""}mm`,
          raHours: eq.raHours,
          decDeg: eq.decDeg,
          widthDeg: fov.widthDeg,
          heightDeg: fov.heightDeg,
        },
      ],
    });
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={caption}>{sky.optics.model} + {sky.camera.model}</div>
      <div style={grid}>
        <Stat label="Larghezza" value={`${fov.widthDeg.toFixed(2)}°`} />
        <Stat label="Altezza" value={`${fov.heightDeg.toFixed(2)}°`} />
        <Stat label="Diagonale" value={`${fov.diagonalDeg.toFixed(2)}°`} />
        <Stat label="Campionamento" value={`${fov.samplingArcsecPx.toFixed(2)}″/px`} />
        <Stat label="Risoluzione teorica" value={`${theoreticalResolution.toFixed(2)}″`} />
      </div>
      <button style={primary} onClick={addToView}>
        Add to view
      </button>
      <p style={hint}>Il rettangolo compare al centro e si trascina col mouse.</p>
      {sky.fovs.map((box) => (
        <div key={box.id} style={row}>
          <span>{box.label} · {box.widthDeg.toFixed(2)}°×{box.heightDeg.toFixed(2)}°</span>
          <button
            style={ghost}
            onClick={() => update({ fovs: sky.fovs.filter((f) => f.id !== box.id) })}
          >
            Rimuovi
          </button>
        </div>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "8px 10px" }}>
      <div style={{ fontSize: 11, color: "#94a3b8" }}>{label}</div>
      <div style={{ fontSize: 14, color: "#f8fafc", fontWeight: 600 }}>{value}</div>
    </div>
  );
}

const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 };
const primary: React.CSSProperties = {
  background: "#f8fafc", color: "#0f172a", border: "none", borderRadius: 12,
  padding: "9px 12px", fontWeight: 600, cursor: "pointer",
};
const ghost: React.CSSProperties = {
  background: "transparent", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 999, padding: "3px 10px", fontSize: 12, cursor: "pointer",
};
const row: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  fontSize: 12, color: "#e2e8f0",
};
const hint: React.CSSProperties = { color: "#94a3b8", fontSize: 12, margin: 0 };
const caption: React.CSSProperties = { color: "#e2e8f0", fontSize: 12, margin: "0 0 2px" };
