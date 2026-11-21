import { solarFocusFov, sunScreenAngleRad } from "../SkyView/solarLayer";
import { basisForView } from "../../services/viewProjection";
import { searchSolarBodies } from "../../services/solarSystem";
import { useEffect, useRef } from "react";
import { useObserver } from "../../hooks/useObserver";
import { useSolarSystem } from "../../hooks/useSolarSystem";
import { useSolarTextures } from "../../hooks/useSolarTextures";
import {
  drawTexturedBody,
  type SolarBodyDefinition,
} from "../../services/solarSystem";
import { useSkyStore } from "../../store/skyStore";
import { formatDec, formatLatLon, formatRa } from "../../utils/format";

interface SolarDetailProps {
  definition: SolarBodyDefinition;
}

function formatDistance(distanceAu: number, distanceKm: number): string {
  if (distanceAu < 0.05) return `${Math.round(distanceKm).toLocaleString("en")} km`;
  return `${distanceAu.toFixed(3)} AU · ${(distanceKm / 1_000_000).toFixed(1)} million km`;
}

function formatAngularDiameter(diameterDeg: number): string {
  const arcseconds = diameterDeg * 3600;
  if (arcseconds < 120) return `${arcseconds.toFixed(1)}″`;
  return `${(diameterDeg * 60).toFixed(1)}′ (${arcseconds.toFixed(0)}″)`;
}

export function SolarDetail({ definition }: SolarDetailProps) {
  const { sky, update } = useSkyStore();
  const observer = useObserver(sky.observer.latDeg, sky.observer.lonDegEast, sky.observer.dateIso);
  const solar = useSolarSystem(observer.latDeg, observer.lonDegEast, sky.observer.dateIso);
  const textures = useSolarTextures();
  const snapshot = solar.bodies.find((body) => body.id === definition.id);
  const previewRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = previewRef.current;
    const image = textures.images[definition.id];
    if (!canvas || !image || !snapshot) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const size = 176;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    const ring = definition.id === "saturn" ? snapshot.ringTiltDeg : null;
    drawTexturedBody(context, image, (size * dpr) / 2, (size * dpr) / 2, size * dpr * (ring == null ? 0.4 : 0.18), {
      phaseFraction: snapshot.phaseFraction,
      sunAngleRad: sunScreenAngleRad(snapshot, solar.sun, basisForView(snapshot.altDeg, snapshot.azDeg)),
      opacity: 1,
      ringTiltDeg: ring,
      ringAlpha: textures.ringAlpha,
    });
  }, [definition.id, snapshot, solar.sun, textures]);

  if (!snapshot) return <p style={hint}>Object unavailable at this time.</p>;

  const center = () => {
    update({
      viewAltDeg: snapshot.altDeg,
      viewAzDeg: snapshot.azDeg,
      fovDeg: solarFocusFov(snapshot),
      showSolarSystem: true,
      selected: {
        kind: "solar",
        label: snapshot.label,
        sub: `${definition.kind === "moon" ? "Satellite" : "Planet"} · magnitude ${snapshot.magnitude.toFixed(1)}`,
        raHours: snapshot.raHours,
        decDeg: snapshot.decDeg,
        mag: snapshot.magnitude,
        ref: definition,
      },
      activePanel: null,
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <canvas
          ref={previewRef}
          role="img"
          aria-label={`${snapshot.label} at its current phase`}
          style={{ width: 88, height: 88, flex: "0 0 auto", borderRadius: "50%", background: "rgba(255,255,255,0.03)" }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
          <div style={{ fontWeight: 650, color: "#f8fafc", fontSize: 17 }}>{snapshot.label}</div>
          <div style={hint}>
            {definition.kind === "moon" ? "Natural satellite" : "Planet"} · {snapshot.englishName}
          </div>
          <div style={hint}>Magnitude {snapshot.magnitude.toFixed(1)}</div>
        </div>
      </div>

      {snapshot.altDeg < 0 && (
        <p style={warning}>Below the horizon by {Math.abs(snapshot.altDeg).toFixed(1)}°.</p>
      )}

      {definition.id === "jupiter" && <section className="galilean-moons" aria-label="Galilean moons">
        <strong>Galilean moons</strong>
        <div>{solar.bodies.filter(body => body.definition.satellite).map(body => (
          <button key={body.id} onClick={() => {
            const selected = searchSolarBodies(body.label, solar).find(hit => hit.ref.id === body.id);
            if (selected) update({ selected });
          }}>
            <img src={`${import.meta.env.BASE_URL}textures/solar-system/${body.definition.texture}`} alt="" />
            {body.label}
          </button>
        ))}</div>
      </section>}
      <dl style={grid}>
        <dt style={term}>Apparent RA / Dec</dt>
        <dd style={value}>{formatRa(snapshot.raHours)} · {formatDec(snapshot.decDeg)}</dd>
        <dt style={term}>Altitude / Azimuth</dt>
        <dd style={value}>{snapshot.altDeg.toFixed(2)}° · {snapshot.azDeg.toFixed(2)}°</dd>
        <dt style={term}>Topocentric distance</dt>
        <dd style={value}>{formatDistance(snapshot.distanceAu, snapshot.distanceKm)}</dd>
        <dt style={term}>Apparent diameter</dt>
        <dd style={value}>{formatAngularDiameter(snapshot.angularDiameterDeg)}</dd>
        <dt style={term}>Illuminated fraction</dt>
        <dd style={value}>{Math.round(snapshot.phaseFraction * 100)}%</dd>
        {snapshot.ringTiltDeg !== null && (
          <>
            <dt style={term}>Ring tilt</dt>
            <dd style={value}>{snapshot.ringTiltDeg.toFixed(1)}°</dd>
          </>
        )}
      </dl>

      <p style={hint}>
        {formatLatLon(observer.latDeg, observer.lonDegEast)} ·{" "}
        {sky.observer.live ? "Live" : "Fixed time"}
      </p>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={center} style={button}>Show on sky</button>
        <button
          onClick={() => update({ showSolarSystem: !sky.showSolarSystem })}
          style={button}
        >
          {sky.showSolarSystem ? "Hide on map" : "Show on map"}
        </button>
      </div>
    </div>
  );
}

const hint: React.CSSProperties = { color: "#94a3b8", fontSize: 12, margin: 0 };
const warning: React.CSSProperties = { color: "#fbbf24", fontSize: 12, margin: 0 };
const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto 1fr",
  gap: "6px 12px",
  margin: 0,
  fontSize: 12.5,
};
const term: React.CSSProperties = { color: "#94a3b8", margin: 0 };
const value: React.CSSProperties = { color: "#f1f5f9", margin: 0, textAlign: "right" };
const button: React.CSSProperties = {
  padding: "7px 11px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.08)",
  color: "#f8fafc",
  fontSize: 13,
  cursor: "pointer",
};
