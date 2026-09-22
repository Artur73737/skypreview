import { useEffect, useRef } from "react";
import { useHipsBackground } from "../../hooks/useHipsBackground";
import type { DsoEntry } from "../../services/catalog";
import { getAladinLiteUrl } from "../../services/survey";
import { useSkyStore } from "../../store/skyStore";
import { formatDec, formatRa } from "../../utils/format";

export function ObjectDetail() {
  const { sky } = useSkyStore();
  const sel = sky.selected;
  const extent = sel?.kind === "dso" ? ((sel.ref as DsoEntry).sizeArcmin[0] ?? 20) / 60 : 0.5;
  const field = Math.max(0.25, extent * 1.5);
  const photo = useHipsBackground(Boolean(sel), (sel?.raHours ?? 0) * 15, sel?.decDeg ?? 0, field, false);
  if (!sel) return <p style={hint}>Clicca un oggetto nel cielo o cercalo.</p>;
  const raDeg = sel.raHours * 15;

  const aladin = getAladinLiteUrl(raDeg, sel.decDeg, 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontWeight: 650, color: "#f8fafc" }}>{sel.label}</div>
      <div style={hint}>{sel.sub}</div>
      <div style={hint}>
        RA {formatRa(sel.raHours)} · Dec {formatDec(sel.decDeg)}
      </div>
      {photo.loading && <p role="status" style={hint}>Caricamento fotografia DSS2…</p>}
      {photo.error && <p role="alert" style={hint}>{photo.error} <button onClick={photo.retry}>Riprova</button></p>}
      {photo.img && <Photo image={photo.img} label={sel.label} />}
      <div style={hint}>Foto DSS2 · CDS · campo {field.toFixed(2)}°</div>
      <a href={aladin} target="_blank" rel="noreferrer" style={link}>
        Apri in Aladin Lite HiPS
      </a>
    </div>
  );
}

const hint: React.CSSProperties = { color: "#94a3b8", fontSize: 12, margin: 0 };
const link: React.CSSProperties = { color: "#7dd3fc", fontSize: 13 };

function Photo({image,label}: {image: HTMLImageElement; label: string}) {
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{const ctx=ref.current?.getContext("2d");ctx?.drawImage(image,0,0,384,384);},[image]);
 return <canvas ref={ref} width={384} height={384} role="img" aria-label={`DSS2 di ${label}`} style={{width:"100%",borderRadius:12}}/>;
}
