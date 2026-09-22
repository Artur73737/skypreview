import { useState } from "react";
import { searchCity, type CityResult } from "../../services/geocode";

export function CitySearch({ onPick }: { onPick: (city: CityResult) => void }) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<CityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  const onChange = (value: string) => {
    setQuery(value);
    window.clearTimeout(timer);
    if (value.trim().length < 3) {
      setHits([]);
      return;
    }
    setLoading(true);
    setTimer(
      window.setTimeout(() => {
        searchCity(value)
          .then(setHits)
          .catch(() => setHits([]))
          .finally(() => setLoading(false));
      }, 400),
    );
  };

  return (
    <div>
      <input
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Cerca citta nel mondo..."
        aria-label="Cerca citta"
        style={inputStyle}
      />
      {loading && <p style={hintStyle}>Cerco...</p>}
      <ul style={{ listStyle: "none", margin: "6px 0 0", padding: 0 }}>
        {hits.map((h) => (
          <li key={`${h.latDeg},${h.lonDegEast}`}>
            <button style={rowStyle} onClick={() => onPick(h)}>
              {h.name}
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
  padding: "6px 8px",
  borderRadius: 8,
  border: "none",
  background: "transparent",
  color: "#e2e8f0",
  fontSize: 12,
  cursor: "pointer",
};

const hintStyle: React.CSSProperties = { color: "#94a3b8", fontSize: 12, margin: "6px 0 0" };
