import { useSkyStore } from "../../store/skyStore";
import { NumberField } from "../NumberField/NumberField";
export function OpticsPanel() {
 const {sky,update}=useSkyStore(); const optics=sky.optics;
 const set=(patch: Partial<typeof optics>)=>update({optics:{...optics,...patch}});
 const eff=optics.focalMm*optics.barlow;
 return <div style={{display:"flex",flexDirection:"column",gap:16}}>
  <NumberField label="Lunghezza focale (mm)" value={optics.focalMm} onChange={focalMm=>set({focalMm})}/>
  <NumberField label="Apertura (mm)" value={optics.apertureMm} onChange={apertureMm=>set({apertureMm})}/>
  <NumberField label="Barlow / riduttore (fattore)" value={optics.barlow} onChange={barlow=>set({barlow})}/>
  <p style={{fontSize:12,color:"#94a3b8",margin:0}}>1 = nessuna lente · 0,7 = riduttore · 2 = Barlow 2×</p>
  <p style={{fontSize:13,margin:0}}>Focale effettiva {eff.toLocaleString("it")} mm · f/{(eff/optics.apertureMm).toFixed(2)}</p>
 </div>;
}
