import { useEffect, useMemo, useRef, useState } from "react";
import { altAzToRaDec, raDecToAltAz } from "../../services/astroMath";
import {
  basisForView,
  projectAltAz,
  unprojectToAltAz,
} from "../../services/viewProjection";
import { useHipsBackground } from "../../hooks/useHipsBackground";
import { useObserver } from "../../hooks/useObserver";
import { useSkyStore } from "../../store/skyStore";
import { SurveyBackground } from "./SurveyBackground";
import { dsoColor, starColor, starRadius } from "./skyDraw";

interface Layer {
  starMag: number;
  starCap: number;
  starNameMag: number;
  dsoMag: number;
  dotsOnly: boolean;
  dsoNames: boolean;
  showConst: boolean;
}

function layerForFov(fov: number): Layer {
  if (fov > 60) {
    return { starMag: 4.6, starCap: 1500, starNameMag: 1.6, dsoMag: 8.2, dotsOnly: true, dsoNames: true, showConst: true };
  }
  if (fov > 20) {
    return { starMag: 6.0, starCap: 3500, starNameMag: 2.2, dsoMag: 10.5, dotsOnly: false, dsoNames: true, showConst: true };
  }
  if (fov > 8) {
    return { starMag: 6.8, starCap: 6500, starNameMag: 2.6, dsoMag: 12.0, dotsOnly: false, dsoNames: true, showConst: true };
  }
  return { starMag: 7.2, starCap: 10000, starNameMag: 3.0, dsoMag: 13.0, dotsOnly: false, dsoNames: true, showConst: false };
}

export function SkyView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600, dpr: 1 });
  const dragRef = useRef<{ mode: "look" | "fov" | null; fovId: string | null }>({
    mode: null,
    fovId: null,
  });
  const startRef = useRef<{ x: number; y: number; alt: number; az: number } | null>(null);
  const movedRef = useRef(false);
  const { sky, catalogs, update } = useSkyStore();
  const observer = useObserver(sky.observer.latDeg, sky.observer.lonDegEast, sky.observer.dateIso);

  const basis = useMemo(() => basisForView(sky.viewAltDeg, sky.viewAzDeg), [sky.viewAltDeg, sky.viewAzDeg]);

  const centerEq = useMemo(
    () => altAzToRaDec(sky.viewAltDeg, sky.viewAzDeg, observer.latDeg, observer.lonDegEast, observer.date),
    [sky.viewAltDeg, sky.viewAzDeg, observer.latDeg, observer.lonDegEast, observer.date],
  );

  // Cover the viewport diagonal, including rotation into equatorial north-up.
  const surveyFov = 2 * Math.atan(Math.tan(sky.fovDeg * Math.PI / 360) * Math.hypot(size.w / size.h, 1)) * 180 / Math.PI;
  const hips = useHipsBackground(sky.showBackground, centerEq.raHours * 15, centerEq.decDeg, surveyFov, sky.hdPhotos);
  const horizontal = useMemo(() => {
    const convert = (ra: number, dec: number) => raDecToAltAz(ra, dec, observer.latDeg, observer.lonDegEast, observer.date);
    return {
      stars: catalogs?.stars.map(s => ({ entry: s, ...convert(s.raHours, s.decDeg) })) ?? [],
      dso: catalogs?.dso.map(d => ({ entry: d, ...convert(d.raHours, d.decDeg) })) ?? [],
    };
  }, [catalogs, observer]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    const parent = canvas.parentElement;
    const fit = () => {
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(300, Math.floor(rect.width * dpr));
      const h = Math.max(300, Math.floor(rect.height * dpr));
      canvas.width = w;
      canvas.height = h;
      setSize({ w, h, dpr });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const frame = requestAnimationFrame(() => {
    const { w, h } = size;
    const date = observer.date;
    const lat = observer.latDeg;
    const lon = observer.lonDegEast;
    const fov = sky.fovDeg;

    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    ctx.save();

    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) / 1.4);
    bg.addColorStop(0, "#0a1120");
    bg.addColorStop(1, "#000000");
    ctx.fillStyle = bg;
    if (!sky.showBackground) ctx.fillRect(0, 0, w, h);

    const toXY = (alt: number, az: number) => projectAltAz(alt, az, basis, fov, w, h);
    const eqToXy = (raH: number, dec: number) => {
      const az = raDecToAltAz(raH, dec, lat, lon, date);
      return { p: toXY(az.altDeg, az.azDeg), alt: az.altDeg };
    };

    const trace = (pts: { x: number; y: number; visible: boolean }[]) => {
      let pen = false;
      for (const p of pts) {
        if (!p.visible) {
          pen = false;
          continue;
        }
        if (!pen) {
          ctx.moveTo(p.x, p.y);
          pen = true;
        } else ctx.lineTo(p.x, p.y);
      }
    };

    ctx.lineWidth = 1;
    if (sky.showAzGrid) {
      ctx.strokeStyle = "rgba(148,163,184,0.14)";
      for (const alt of [15, 30, 45, 60, 75]) {
        ctx.beginPath();
        trace(Array.from({ length: 181 }, (_, i) => toXY(alt, i * 2)));
        ctx.stroke();
      }
      for (let az = 0; az < 360; az += 15) {
        ctx.beginPath();
        trace(Array.from({ length: 50 }, (_, i) => toXY(-5 + i * 2, az)));
        ctx.stroke();
      }
    }
    if (sky.showEqGrid && fov > 4) {
      ctx.strokeStyle = "rgba(148,163,184,0.13)";
      for (let ra = 0; ra < 24; ra += 1) {
        ctx.beginPath();
        trace(
          Array.from({ length: 52 }, (_, i) => {
            const dec = -78 + i * 3;
            return eqToXy(ra, dec).p;
          }),
        );
        ctx.stroke();
      }
      for (let dec = -60; dec <= 60; dec += 30) {
        ctx.beginPath();
        trace(Array.from({ length: 97 }, (_, i) => eqToXy(i * 0.25, dec).p));
        ctx.stroke();
      }
    }

    if (sky.showHorizon) {
    const horizonPts = Array.from({ length: 181 }, (_, i) => toXY(0, i * 2)).filter(
      (p) => p.visible,
    );
    if (horizonPts.length > 1) {
      const glow = ctx.createLinearGradient(0, cy - h * 0.12, 0, cy + h * 0.1);
      glow.addColorStop(0, "rgba(56,120,200,0.0)");
      glow.addColorStop(0.55, "rgba(56,120,200,0.16)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath();
      ctx.moveTo(horizonPts[0].x, horizonPts[0].y);
      for (const p of horizonPts) ctx.lineTo(p.x, p.y);
      ctx.lineTo(w + 100, h + 100);
      ctx.lineTo(-100, h + 100);
      ctx.closePath();
      ctx.fillStyle = glow;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(horizonPts[0].x, horizonPts[0].y);
      for (const p of horizonPts) ctx.lineTo(p.x, p.y);
      ctx.lineTo(w + 100, h + 100);
      ctx.lineTo(-100, h + 100);
      ctx.closePath();
      ctx.fillStyle = "rgba(1,3,8,0.62)";
      ctx.fill();
    }
    ctx.beginPath();
    trace(Array.from({ length: 181 }, (_, i) => toXY(0, i * 2)));
    ctx.strokeStyle = "rgba(125,211,252,0.4)";
    ctx.lineWidth = 1.4 * size.dpr;
    ctx.stroke();

    }

    const layer = layerForFov(fov);
    const placed: { x: number; y: number; width: number }[] = [];
    const claim = (x: number, y: number, text: string): boolean => {
      ctx.font = `${12 * size.dpr}px system-ui`;
      const width = ctx.measureText(text).width + 10 * size.dpr;
      const height = 18 * size.dpr;
      if (x < 0 || x + width > w || y < height || y > h - 70 * size.dpr) return false;
      if (placed.some(p => x < p.x + p.width && x + width > p.x && Math.abs(y - p.y) < height)) return false;
      placed.push({ x, y, width });
      return true;
    };
    if (catalogs) {
      if (sky.showConstellations) {
        ctx.strokeStyle = "rgba(148,163,184,0.42)";
        ctx.lineWidth = 1;
        for (const c of catalogs.constellations) {
          for (const path of c.lines) {
            ctx.beginPath();
            trace(
              path.map(([raH, dec]) => {
                const az = raDecToAltAz(raH, dec, lat, lon, date);
                return toXY(az.altDeg, az.azDeg);
              }),
            );
            ctx.stroke();
          }
        }
      }
      const sizeK = Math.min(w, h) / 800;
      let drawnStars = 0;
      let starNameCount = 0;
      for (const cached of horizontal.stars) {
        if (!sky.showStars && !sky.showStarNames) break;
        const s = cached.entry;
        if (s.mag > layer.starMag || drawnStars >= layer.starCap) break;
        const r = { p: toXY(cached.altDeg, cached.azDeg), alt: cached.altDeg };
        if (!r.p.visible || r.p.x < 0 || r.p.x > w || r.p.y < 0 || r.p.y > h) continue;
        const below = sky.showHorizon && r.alt < 0;
        ctx.globalAlpha = below ? 0.1 : 1;
        ctx.fillStyle = starColor(s.bv);
        if (sky.showStars) {
        if (s.mag < 3.5) {
          ctx.beginPath();
          ctx.arc(r.p.x, r.p.y, starRadius(s.mag, sizeK), 0, Math.PI * 2);
          ctx.fill();
        } else {
          const px = s.mag < 5 ? 2 : 1.4;
          ctx.fillRect(r.p.x - px / 2, r.p.y - px / 2, px, px);
        }
        }
        drawnStars += 1;
        if (
          sky.showStarNames &&
          s.mag < layer.starNameMag &&
          !below &&
          starNameCount < 40 &&
          claim(r.p.x + 7, r.p.y - 6, s.name)
        ) {
          ctx.globalAlpha = 0.9;
          ctx.fillStyle = "#cbd5e1";
          ctx.font = `${12 * size.dpr}px system-ui`;
          ctx.fillText(s.name, r.p.x + 7, r.p.y - 6);
          starNameCount += 1;
        }
        ctx.globalAlpha = 1;
      }
      if (sky.showDso || sky.showDsoNames) {
        const fovW = fov * (w / h);
        let dsoNameCount = 0;
        for (const cached of horizontal.dso) {
          const d = cached.entry;
          if (d.mag === null ? !d.messier || fov > 20 : d.mag > layer.dsoMag) continue;
          const r = { p: toXY(cached.altDeg, cached.azDeg), alt: cached.altDeg };
          if (!r.p.visible || r.p.x < 0 || r.p.x > w || r.p.y < 0 || r.p.y > h) continue;
          const below = sky.showHorizon && r.alt < 0;
          ctx.globalAlpha = below ? 0.1 : 0.95;
          ctx.strokeStyle = dsoColor(d.type);
          ctx.fillStyle = dsoColor(d.type);
          if (sky.showDso) {
          if (layer.dotsOnly) {
            ctx.beginPath();
            ctx.arc(r.p.x, r.p.y, 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            const deg = ((d.sizeArcmin[0] ?? 8) / 60 || 8 / 60);
            const px = Math.max(4, Math.min(40, (deg / fovW) * w * 0.5));
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.ellipse(r.p.x, r.p.y, px, px * 0.65, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
          }
          const named =
            fov > 20 ? d.messier : (d.messier ?? (d.mag !== null && d.mag < 9.5 ? d.id : null));
          if (
            sky.showDsoNames &&
            layer.dsoNames &&
            !below &&
            named &&
            dsoNameCount < 25 &&
            claim(r.p.x + 7, r.p.y + 4, named)
          ) {
            ctx.fillStyle = "#e2e8f0";
            ctx.font = `${12 * size.dpr}px system-ui`;
            ctx.fillText(named, r.p.x + 7, r.p.y + 4);
            dsoNameCount += 1;
          }
          ctx.globalAlpha = 1;
        }
      }
    }

    if (sky.showCardinal) {
      const labels: [string, number][] = [["N", 0], ["E", 90], ["S", 180], ["W", 270]];
      ctx.font = `${13 * size.dpr}px system-ui`;
      for (const [label, az] of labels) {
        const p = toXY(3, az);
        if (!p.visible) continue;
        const x = Math.max(20, Math.min(w - 20, p.x));
        const y = Math.max(20, Math.min(h - 20, p.y));
        ctx.fillStyle = "rgba(10,14,24,0.78)";
        const tw = ctx.measureText(label).width + 20;
        ctx.beginPath();
        ctx.roundRect(x - tw / 2, y - 13 * size.dpr, tw, 26 * size.dpr, 13 * size.dpr);
        ctx.fill();
        ctx.fillStyle = "#f1f5f9";
        ctx.textAlign = "center";
        ctx.fillText(label, x, y + 5 * size.dpr);
        ctx.textAlign = "left";
      }
    }

    const fovW = fov * (w / h);
    const palette = ["#38bdf8", "#a78bfa", "#34d399", "#fbbf24"];
    sky.fovs.forEach((box, i) => {
      const r = eqToXy(box.raHours, box.decDeg);
      if (!r.p.visible) return;
      const fw = Math.tan(box.widthDeg * Math.PI / 360) / Math.tan(fov * Math.PI / 360) * h;
      const fh = Math.tan(box.heightDeg * Math.PI / 360) / Math.tan(fov * Math.PI / 360) * h;
      ctx.strokeStyle = palette[i % palette.length];
      ctx.lineWidth = 1.6;
      ctx.setLineDash([7, 5]);
      ctx.strokeRect(r.p.x - fw / 2, r.p.y - fh / 2, fw, fh);
      ctx.setLineDash([]);
      ctx.fillStyle = palette[i % palette.length];
      ctx.font = `${12 * size.dpr}px system-ui`;
      ctx.fillText(
        `${box.label} ${box.widthDeg.toFixed(2)}°×${box.heightDeg.toFixed(2)}°`,
        r.p.x - fw / 2 + 4,
        r.p.y - fh / 2 - 8,
      );
    });

    if (sky.selected) {
      const r = eqToXy(sky.selected.raHours, sky.selected.decDeg);
      if (r.p.visible) {
        ctx.strokeStyle = "#f8fafc";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(r.p.x, r.p.y, 14 * size.dpr, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.restore();
    });
    return () => cancelAnimationFrame(frame);
  });

  const toLocal = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left) * size.dpr, y: (e.clientY - rect.top) * size.dpr };
  };

  const focalPx = (size.h / 2) / Math.tan((sky.fovDeg * Math.PI) / 360);

  const pickFov = (alt: number, az: number): string | null => {
    const date = observer.date;
    for (let i = sky.fovs.length - 1; i >= 0; i -= 1) {
      const box = sky.fovs[i];
      const c = raDecToAltAz(box.raHours, box.decDeg, observer.latDeg, observer.lonDegEast, date);
      const dAz = Math.abs(((az - c.azDeg + 540) % 360) - 180) * Math.cos((c.altDeg * Math.PI) / 180);
      if (dAz < box.widthDeg / 2 && Math.abs(alt - c.altDeg) < box.heightDeg / 2) return box.id;
    }
    return null;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const { x, y } = toLocal(e);
    const ll = unprojectToAltAz(x, y, basis, sky.fovDeg, size.w, size.h);
    dragRef.current = {
      mode: pickFov(ll.altDeg, ll.azDeg) ? "fov" : "look",
      fovId: pickFov(ll.altDeg, ll.azDeg),
    };
    startRef.current = { x, y, alt: sky.viewAltDeg, az: sky.viewAzDeg };
    movedRef.current = false;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.mode || !startRef.current) return;
    const { x, y } = toLocal(e);
    const dx = x - startRef.current.x;
    const dy = y - startRef.current.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) movedRef.current = true;
    if (dragRef.current.mode === "fov" && dragRef.current.fovId) {
      const ll = unprojectToAltAz(x, y, basis, sky.fovDeg, size.w, size.h);
      const eq = altAzToRaDec(ll.altDeg, ll.azDeg, observer.latDeg, observer.lonDegEast, observer.date);
      update({
        fovs: sky.fovs.map((f) =>
          f.id === dragRef.current.fovId ? { ...f, raHours: eq.raHours, decDeg: eq.decDeg } : f,
        ),
      });
      return;
    }
    const cosA = Math.max(0.35, Math.cos((startRef.current.alt * Math.PI) / 180));
    const dAz = dx / focalPx / cosA / (Math.PI / 180);
    const dAlt = dy / focalPx / (Math.PI / 180);
    update({
      viewAzDeg: ((startRef.current.az - dAz) % 360 + 360) % 360,
      viewAltDeg: Math.max(-89.9, Math.min(89.9, startRef.current.alt + dAlt)),
    });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const wasClick = !movedRef.current;
    dragRef.current = { mode: null, fovId: null };
    startRef.current = null;
    if (!wasClick || !catalogs) return;
    const { x, y } = toLocal(e);
    const ll = unprojectToAltAz(x, y, basis, sky.fovDeg, size.w, size.h);
    const eq = altAzToRaDec(ll.altDeg, ll.azDeg, observer.latDeg, observer.lonDegEast, observer.date);
    const tol = Math.max(0.2, sky.fovDeg * 0.03);
    let best: { ra: number; dec: number; label: string; sub: string; mag: number | null; ref: never } | null = null;
    let bestDist = tol;
    for (const d of catalogs.dso) {
      if (!d.messier && (d.mag === null || d.mag > 11)) continue;
      const dRa = Math.abs(((d.raHours - eq.raHours + 36) % 24) - 12) * 15 * Math.cos((d.decDeg * Math.PI) / 180);
      const dist = Math.hypot(dRa, d.decDeg - eq.decDeg);
      if (dist < bestDist) {
        bestDist = dist;
        best = {
          ra: d.raHours,
          dec: d.decDeg,
          label: d.messier ? `${d.messier} · ${d.id}` : d.id,
          sub: `${d.type} mag ${d.mag ?? "?"}`,
          mag: d.mag,
          ref: d as never,
        };
      }
    }
    if (best) {
      update({
        selected: {
          kind: "dso",
          label: best.label,
          sub: best.sub,
          raHours: best.ra,
          decDeg: best.dec,
          mag: best.mag,
          ref: best.ref,
        },
        activePanel: "object",
      });
    }
  };

  const onWheel = (e: React.WheelEvent) => {
    const factor = e.deltaY > 0 ? 1.15 : 0.87;
    update({ fovDeg: Math.max(0.3, Math.min(120, sky.fovDeg * factor)) });
  };

  return (
    <>
      {sky.showBackground && <SurveyBackground basis={basis} fov={sky.fovDeg} width={size.w} height={size.h} lat={observer.latDeg} lon={observer.lonDegEast} date={observer.date} hips={hips} />}
      <canvas
        ref={canvasRef}
        style={{ position: "relative", width: "100%", height: "100%", display: "block", touchAction: "none", cursor: "grab" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { dragRef.current = { mode: null, fovId: null }; startRef.current = null; }}
        onWheel={onWheel}
      />
      {sky.showBackground && hips.loading && <div className="hd-loading" role="status">DSS2 · caricamento dettagli…</div>}
      {sky.showBackground && hips.error && <div className="hd-loading" role="alert">{hips.error} <button onClick={hips.retry}>Riprova</button></div>}
    </>
  );
}
