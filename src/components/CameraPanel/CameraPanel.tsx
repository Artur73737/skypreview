import { sensorSizeMm } from "../../services/fov";
import { useSkyStore } from "../../store/skyStore";
import { NumberField } from "../NumberField/NumberField";
export function CameraPanel() {
 const {sky,update}=useSkyStore(); const cam=sky.camera;
 const set=(patch: Partial<typeof cam>)=>update({camera:{...cam,...patch}});
 return <div style={{display:"flex",flexDirection:"column",gap:16}}>
  <NumberField label="Risoluzione X (pixel)" integer value={cam.resXpx} onChange={resXpx=>set({resXpx})}/>
  <NumberField label="Risoluzione Y (pixel)" integer value={cam.resYpx} onChange={resYpx=>set({resYpx})}/>
  <NumberField label="Dimensione pixel (µm)" value={cam.pixelUm} onChange={pixelUm=>set({pixelUm})}/>
  <p style={{fontSize:13,margin:0}}>Sensore {sensorSizeMm(cam.resXpx,cam.pixelUm).toFixed(2)} × {sensorSizeMm(cam.resYpx,cam.pixelUm).toFixed(2)} mm</p>
 </div>;
}
