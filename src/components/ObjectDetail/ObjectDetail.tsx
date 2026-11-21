import { useEffect, useRef, useState } from "react";
import { useHipsBackground } from "../../hooks/useHipsBackground";
import type { DsoEntry } from "../../services/catalog";
import { getAladinLiteUrl } from "../../services/survey";
import { useSkyStore } from "../../store/skyStore";
import { formatDec, formatRa } from "../../utils/format";
import { SolarDetail } from "./SolarDetail";

export function ObjectDetail() {
  const { sky } = useSkyStore();
  const sel = sky.selected;
  const extent = sel?.kind === "dso" ? ((sel.ref as DsoEntry).sizeArcmin[0] ?? 20) / 60 : 0.5;
  const field = Math.max(0.25, extent * 1.5);
  const photo = useHipsBackground(Boolean(sel && sel.kind !== "solar"), (sel?.raHours ?? 0) * 15, sel?.decDeg ?? 0, field, sky.quality.previewSize, false, sky.quality.maxOrder);
  if (!sel) return <p style={hint}>Select an object on the map or use Search.</p>;
  if (sel.kind === "solar") return <SolarDetail definition={sel.ref} />;
  const raDeg = sel.raHours * 15;

  const aladin = getAladinLiteUrl(raDeg, sel.decDeg, 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontWeight: 650, color: "#f8fafc" }}>{sel.label}</div>
      <div style={hint}>{sel.sub}</div>
      <div style={hint}>
        RA {formatRa(sel.raHours)} · Dec {formatDec(sel.decDeg)}
      </div>
      {photo.loading && <p role="status" style={hint}>Loading DSS2 preview…</p>}
      {photo.error && <p role="alert" style={hint}>{photo.error} <button onClick={photo.retry}>Retry</button></p>}
      {photo.img && <Photo image={photo.img} label={sel.label} />}
      <div style={hint}>DSS2 · CDS · field {field.toFixed(2)}°</div>
      <a href={aladin} target="_blank" rel="noreferrer" style={link}>
        Open in Aladin Lite
      </a>
    </div>
  );
}

const hint: React.CSSProperties = { color: "#94a3b8", fontSize: 12, margin: 0 };
const link: React.CSSProperties = { color: "#7dd3fc", fontSize: 13 };

function Photo({image,label}: {image: HTMLImageElement | HTMLCanvasElement; label: string}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [exposure, setExposure] = useState(-1);
  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    canvas.width = image instanceof HTMLImageElement ? image.naturalWidth : image.width;
    canvas.height = image instanceof HTMLImageElement ? image.naturalHeight : image.height;
    context.drawImage(image, 0, 0);
  }, [image]);
  return <div className="object-preview">
    <canvas ref={ref} role="img" aria-label={`DSS2 of ${label}`}
      style={{ filter: `brightness(${2 ** exposure})` }} />
    <label>Preview brightness <output>{Math.round(100 * 2 ** exposure)}%</output>
      <input type="range" min={-3} max={0} step={0.1} value={exposure}
        onChange={event => setExposure(Number(event.target.value))} />
    </label>
  </div>;
}
