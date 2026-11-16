import { SMART_TELESCOPE_PRESETS, type SmartTelescopePreset } from "../../data/equipment";
import { computeFov } from "../../services/fov";

interface QuickFovPreviewProps {
  onPreview: (preset: SmartTelescopePreset) => void;
}

export function QuickFovPreview({ onPreview }: QuickFovPreviewProps) {
  if (SMART_TELESCOPE_PRESETS.length === 0) return null;
  return (
    <div style={wrapper}>
      <div style={title}>Anteprima rapida · telescopi smart</div>
      {SMART_TELESCOPE_PRESETS.map((preset) => {
        const camera = preset.integratedCamera;
        const fov = computeFov(
          preset.focalMm,
          preset.apertureMm,
          1,
          camera.resXpx,
          camera.resYpx,
          camera.pixelUm,
        );
        return (
          <button
            key={preset.id}
            style={button}
            onClick={() => onPreview(preset)}
            title="Imposta ottica e camera e mostra il campo nella vista"
          >
            <span style={name}>{preset.name}</span>
            <span style={detail}>
              {fov.widthDeg.toFixed(2)}° × {fov.heightDeg.toFixed(2)}° · {preset.focalMm} mm ·{" "}
              {camera.resXpx}×{camera.resYpx}
            </span>
          </button>
        );
      })}
    </div>
  );
}

const wrapper: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6 };
const title: React.CSSProperties = { fontSize: 12, textTransform: "uppercase", letterSpacing: ".06em", color: "#94a3b8" };
const button: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 3,
  textAlign: "left",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(56,189,248,0.45)",
  background: "rgba(56,189,248,0.12)",
  color: "#f8fafc",
  cursor: "pointer",
};
const name: React.CSSProperties = { fontWeight: 600, fontSize: 13 };
const detail: React.CSSProperties = { color: "#bae6fd", fontSize: 11 };
