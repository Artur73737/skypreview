import { useSkyStore } from "../../store/skyStore";

const ROWS: { key: "showStars" | "showEqGrid" | "showAzGrid" | "showConstellations" | "showStarNames" | "showDso" | "showDsoNames" | "showCardinal" | "showHorizon" | "showBackground" | "hdPhotos"; label: string }[] = [
  { key: "showBackground", label: "Fotografie DSS2 (tutto il cielo)" },
  { key: "showEqGrid", label: "Griglia equatoriale" },
  { key: "showAzGrid", label: "Griglia altazimutale" },
  { key: "showConstellations", label: "Costellazioni" },
  { key: "showStars", label: "Stelle del catalogo" },
  { key: "showStarNames", label: "Nomi stelle" },
  { key: "showDso", label: "Simboli deep sky" },
  { key: "showDsoNames", label: "Nomi oggetti" },
  { key: "showCardinal", label: "Punti cardinali" },
  { key: "showHorizon", label: "Orizzonte locale" },
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
        Campo {sky.fovDeg < 10 ? `${sky.fovDeg.toFixed(1)}°` : `${sky.fovDeg.toFixed(0)}°`}
        <input
          type="range"
          min={0.5}
          max={110}
          step={0.5}
          value={sky.fovDeg}
          onChange={(e) => update({ fovDeg: Number(e.target.value) })}
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
