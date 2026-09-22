import { CitySearch } from "../CitySearch";
import { LocationMinimap } from "../LocationMinimap";
import { useObserver } from "../../hooks/useObserver";
import { useSkyStore } from "../../store/skyStore";
import { formatLatLon } from "../../utils/format";

export function LocationPanel() {
  const { sky, update } = useSkyStore();
  const obs = sky.observer;
  const info = useObserver(obs.latDeg, obs.lonDegEast, obs.dateIso);
  const setPos = (latDeg: number, lonDegEast: number) =>
    update({ observer: { ...obs, latDeg, lonDegEast } });
  const geolocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setPos(
        Math.round(pos.coords.latitude * 100) / 100,
        Math.round(pos.coords.longitude * 100) / 100,
      );
    });
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 13, color: "#e2e8f0" }}>
        {formatLatLon(obs.latDeg, obs.lonDegEast)} · LST {info.lstHours.toFixed(2)}h
      </div>
      <CitySearch
        onPick={(city) => setPos(city.latDeg, city.lonDegEast)}
      />
      <LocationMinimap latDeg={obs.latDeg} lonDegEast={obs.lonDegEast} onPick={setPos} />
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
      <button style={chip} onClick={geolocate}>La mia posizione</button>
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
        Tempo reale dal PC
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
  color: "#f1f5f9", borderRadius: 999, padding: "6px 10px", fontSize: 12, cursor: "pointer",
};
