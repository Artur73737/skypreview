import { OpticsPanel } from "../OpticsPanel";
import { CameraPanel } from "../CameraPanel";
import { SMART_TELESCOPE_PRESETS, type SmartTelescopePreset } from "../../data/equipment";
import { useFovSetup } from "../../hooks/useFovSetup";
import { altAzToRaDec } from "../../services/astroMath";
import { computeFov } from "../../services/fov";
import { useSkyStore, type FovBox } from "../../store/skyStore";
import { QuickFovPreview } from "./QuickFovPreview";

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
  const integratedCameraModel = SMART_TELESCOPE_PRESETS.find(
    (preset) => preset.name === sky.optics.model,
  )?.integratedCamera.model;

  const buildFovBox = (label: string, widthDeg: number, heightDeg: number): FovBox => {
    const eq = altAzToRaDec(
      sky.viewAltDeg,
      sky.viewAzDeg,
      sky.observer.latDeg,
      sky.observer.lonDegEast,
      new Date(sky.observer.dateIso),
    );
    return {
      id: `fov-${Date.now()}`,
      label,
      raHours: eq.raHours,
      decDeg: eq.decDeg,
      widthDeg,
      heightDeg,
    };
  };

  const addToView = () =>
    update({
      activePanel: null,
      fovs: [
        ...sky.fovs,
        buildFovBox(
          `${sky.optics.focalMm}${sky.optics.barlow > 1 ? `×${sky.optics.barlow}` : ""}mm`,
          fov.widthDeg,
          fov.heightDeg,
        ),
      ],
    });

  const previewSmartTelescope = (preset: SmartTelescopePreset) => {
    const camera = preset.integratedCamera;
    const presetFov = computeFov(
      preset.focalMm,
      preset.apertureMm,
      1,
      camera.resXpx,
      camera.resYpx,
      camera.pixelUm,
    );
    update({
      optics: { model: preset.name, focalMm: preset.focalMm, apertureMm: preset.apertureMm, barlow: 1 },
      camera: {
        model: camera.model,
        resXpx: camera.resXpx,
        resYpx: camera.resYpx,
        pixelUm: camera.pixelUm,
      },
      fovDeg: Math.max(0.3, Math.min(sky.fovDeg, presetFov.diagonalDeg * 2.5)),
      activePanel: null,
      fovs: [
        ...sky.fovs.filter((box) => box.label !== preset.name),
        buildFovBox(preset.name, presetFov.widthDeg, presetFov.heightDeg),
      ],
    });
  };

  return (
    <div className="fov-workspace">
      <div style={caption}>
        {sky.optics.model}
        {sky.camera.model !== integratedCameraModel ? ` + ${sky.camera.model}` : ""}
      </div>
      <div style={grid}>
        <Stat label="Width" value={`${fov.widthDeg.toFixed(2)}°`} />
        <Stat label="Height" value={`${fov.heightDeg.toFixed(2)}°`} />
        <Stat label="Diagonal" value={`${fov.diagonalDeg.toFixed(2)}°`} />
        <Stat label="Image scale" value={`${fov.samplingArcsecPx.toFixed(2)}″/px`} />
        <Stat label="Dawes limit" value={`${theoreticalResolution.toFixed(2)}″`} />
      </div>
      <button className="fov-primary" style={primary} onClick={addToView}>
        Add frame to sky
      </button>
      <p style={hint}>Drag the frame on the sky to reposition it.</p>
      <div className="equipment-grid">
        <details><summary>Telescope</summary><OpticsPanel /></details>
        <details><summary>Camera</summary><CameraPanel /></details>
      </div>
      <details className="smart-presets">
        <summary>Smart telescope presets</summary>
        <QuickFovPreview onPreview={previewSmartTelescope} />
      </details>
      {sky.fovs.map((box) => (
        <div key={box.id} style={row}>
          <span>{box.label} · {box.widthDeg.toFixed(2)}°×{box.heightDeg.toFixed(2)}°</span>
          <button
            style={ghost}
            onClick={() => update({ fovs: sky.fovs.filter((f) => f.id !== box.id) })}
          >
            Remove
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
