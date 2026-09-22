import { useObserver } from "../../hooks/useObserver";
import { useSkyStore } from "../../store/skyStore";
import { formatLatLon } from "../../utils/format";

const CITIES = [
  { name: "Milano", lat: 45.4642, lon: 9.19 },
  { name: "Roma", lat: 41.9028, lon: 12.4964 },
  { name: "Napoli", lat: 40.8518, lon: 14.2681 },
  { name: "Torino", lat: 45.0703, lon: 7.6869 },
  { name: "Palermo", lat: 38.1157, lon: 13.3615 },
  { name: "Paranal", lat: -24.6272, lon: -70.4044 },
];

export function LocationPanel() {
  const { sky, update } = useSkyStore();
  const obs = sky.observer;
  const info = useObserver(obs.latDeg, obs.lonDegEast, obs.dateIso);
  const geolocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      update({
        observer: {
          ...obs,
          latDeg: Math.round(pos.coords.latitude * 100) / 100,
          lonDegEast: Math.round(pos.coords.longitude * 100) / 100,
        },
      });
    });
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 13, color: "#e2e8f0" }}>
        {formatLatLon(obs.latDeg, obs.lonDegEast)} · LST {info.lstHours.toFixed(2)}h
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <label style={field}>
          Lat
          <input type="number" step={0.01} value={obs.latDeg} style={input}
            onChange={(e) => update({ observer: { ...obs, latDeg: Number(e.target.value) } })} />
        </label>
        <label style={field}>
          Lon E
          <input type="number" step={0.01} value={obs.lonDegEast} style={input}
            onChange={(e) => update({ observer: { ...obs, lonDegEast: Number(e.target.value) } })} />
        </label>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {CITIES.map((c) => (
          <button key={c.name} style={chip}
            onClick={() => update({ observer: { ...obs, latDeg: c.lat, lonDegEast: c.lon } })}>
            {c.name}
          </button>
        ))}
        <button style={chip} onClick={geolocate}>La mia posizione</button>
      </div>
      <label style={field}>
        Data e ora
        <input type="datetime-local" style={input}
          value={obs.dateIso.slice(0, 16)}
          onChange={(e) => update({
            observer: { ...obs, dateIso: new Date(e.target.value).toISOString(), live: false },
          })} />
      </label>
      <label style={{ ...field, flexDirection: "row", alignItems: "center", gap: 8 }}>
        <input type="checkbox" checked={obs.live}
          onChange={(e) => update({
            observer: {
              ...obs,
              live: e.target.checked,
              dateIso: new Date().toISOString(),
            },
          })} />
        Tempo reale
      </label>
    </div>
  );
}

const field: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6, color: "#e2e8f0", fontSize: 13, flex: 1 };
const input: React.CSSProperties = {
  padding: "7px 9px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.08)", color: "#f8fafc",
};
const chip: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.06)",
  color: "#f1f5f9", borderRadius: 999, padding: "4px 10px", fontSize: 12, cursor: "pointer",
};
