import { MIN_FOV_DEG, MAX_FOV_DEG } from "../SkyView/pinch";
import { useSkyStore } from "../../store/skyStore";

const ROWS: { key: "showStars" | "showEqGrid" | "showAzGrid" | "showConstellations" | "showStarNames" | "showDso" | "showDsoNames" | "showCardinal" | "showHorizon" | "showBackground" | "hdPhotos" | "showSolarSystem"; label: string }[] = [
  { key: "showBackground", label: "DSS2 photography" },
  { key: "showSolarSystem", label: "Solar system" },
  { key: "showEqGrid", label: "Equatorial grid" },
  { key: "showAzGrid", label: "Altitude–azimuth grid" },
  { key: "showConstellations", label: "Constellations" },
  { key: "showStars", label: "Catalog stars" },
  { key: "showStarNames", label: "Star names" },
  { key: "showDso", label: "Deep-sky markers" },
  { key: "showDsoNames", label: "Object names" },
  { key: "showCardinal", label: "Compass points" },
  { key: "showHorizon", label: "Local horizon" },
];

export function DisplayControls() {
  const { sky, update } = useSkyStore();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {ROWS.map((row) => (
        <label key={row.key} style={labelStyle}>
          <input
            type="checkbox"
            checked={sky[row.key]}
            onChange={(e) => update({ [row.key]: e.target.checked } as never)}
          />
          {row.label}
        </label>
      ))}
      <label style={labelStyle}>
        Zoom {sky.fovDeg < 0.1 ? `${(sky.fovDeg * 3600).toFixed(1)}″` : sky.fovDeg < 10 ? `${sky.fovDeg.toFixed(1)}°` : `${sky.fovDeg.toFixed(0)}°`}
        <input
          type="range"
          min={Math.log10(MIN_FOV_DEG)}
          max={Math.log10(MAX_FOV_DEG)}
          step="any"
          value={Math.log10(sky.fovDeg)}
          onChange={(e) => update({ fovDeg: 10 ** Number(e.target.value) })}
          style={{ width: "100%" }}
        />
      </label>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  color: "#e2e8f0",
  fontSize: 13,
  padding: "4px 2px",
};
