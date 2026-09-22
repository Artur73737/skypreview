import { useEffect, useState } from "react";
export function NumberField({ label, value, onChange, integer = false }: { label: string; value: number; onChange: (value: number) => void; integer?: boolean }) {
 const [draft, setDraft] = useState(String(value));
 useEffect(() => setDraft(String(value)), [value]);
 const number = Number(draft);
 const valid = draft.trim() !== "" && Number.isFinite(number) && number > 0 && (!integer || Number.isInteger(number));
 return <label style={{display:"flex",flexDirection:"column",gap:6,fontSize:13,color:"#cbd5e1"}}>
  {label}
  <input type="number" step={integer ? 1 : "any"} value={draft} aria-invalid={!valid}
   onChange={e => { const text=e.target.value; setDraft(text); const n=Number(text); if(text.trim() && Number.isFinite(n) && n>0 && (!integer || Number.isInteger(n))) onChange(n); }}
   style={{width:"100%",padding:"10px 12px",borderRadius:10,border:`1px solid ${valid ? "#334155" : "#fb7185"}`,background:"#111827",color:"#f8fafc"}} />
  {!valid && <small role="status">Inserisci un numero {integer ? "intero " : ""}maggiore di zero.</small>}
 </label>;
}
