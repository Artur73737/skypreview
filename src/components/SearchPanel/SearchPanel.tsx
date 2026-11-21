import { useMemo, useState } from "react";
import { raDecToAltAz } from "../../services/astroMath";
import { searchCatalogs } from "../../services/catalog";
import { searchSolarBodies } from "../../services/solarSystem";
import { useSolarSystem } from "../../hooks/useSolarSystem";
import { useSkyStore } from "../../store/skyStore";

export function SearchPanel() {
  const { sky, catalogs, catalogLoading, update } = useSkyStore();
  const [query, setQuery] = useState("M31");
  const solar = useSolarSystem(sky.observer.latDeg, sky.observer.lonDegEast, sky.observer.dateIso);
  const hits = useMemo(
    () => [
      ...searchSolarBodies(query, solar),
      ...(catalogs ? searchCatalogs(catalogs, query) : []),
    ],
    [catalogs, query, solar],
  );
  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search M31, Vega, Jupiter…"
        aria-label="Find an object"
        style={inputStyle}
      />
      {catalogLoading && <p style={hintStyle}>Loading catalogs…</p>}
      {!catalogLoading && query.trim().length >= 2 && hits.length === 0 && (
        <p style={hintStyle}>No objects found.</p>
      )}
      <ul style={{ listStyle: "none", margin: "8px 0 0", padding: 0 }}>
        {hits.map((h) => (
          <li key={`${h.kind}-${h.label}`}>
            <button
              style={rowStyle}
              onClick={() => {
                if (h.kind === "solar") {
                  const snapshot = solar.bodies.find((body) => body.id === h.ref.id);
                  if (!snapshot) return;
                  update({
                    viewAltDeg: snapshot.altDeg,
                    viewAzDeg: snapshot.azDeg,
                    fovDeg: snapshot.angularDiameterDeg * 8,
                    selected: h,
                    activePanel: "object",
                  });
                  return;
                }
                const date = new Date(sky.observer.dateIso);
                const ll = raDecToAltAz(
                  h.raHours,
                  h.decDeg,
                  sky.observer.latDeg,
                  sky.observer.lonDegEast,
                  date,
                );
                update({
                  viewAltDeg: ll.altDeg,
                  viewAzDeg: ll.azDeg,
                  fovDeg: h.kind === "dso" ? 8 : 25,
                  selected: h,
                  activePanel: "object",
                });
              }}
            >
              <span style={{ fontWeight: 600 }}>{h.label}</span>
              <span style={hintStyle}>{h.sub}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.08)",
  color: "#f8fafc",
  outline: "none",
};

const rowStyle: React.CSSProperties = {
  width: "100%",
  textAlign: "left",
  display: "flex",
  flexDirection: "column",
  gap: 2,
  padding: "7px 8px",
  borderRadius: 10,
  border: "none",
  background: "transparent",
  color: "#f1f5f9",
  cursor: "pointer",
};

const hintStyle: React.CSSProperties = { color: "#94a3b8", fontSize: 12, margin: "6px 0 0" };
