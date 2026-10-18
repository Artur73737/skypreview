export interface TelescopePreset {
  id: string;
  name: string;
  brand: string;
  apertureMm: number;
  focalMm: number;
  focalRatio: string;
  resolutionArcsec: number;
  type: string;
  notes: string;
}

export interface CameraPreset {
  id: string;
  name: string;
  brand: string;
  resXpx: number;
  resYpx: number;
  pixelUm: number;
  megapixels: number;
  price: string;
  notes?: string;
}

export const TELESCOPE_PRESETS: TelescopePreset[] = [
  { id: "askar-71f", name: "Askar 71F", brand: "Askar", apertureMm: 71, focalMm: 490, focalRatio: "f/6.9", resolutionArcsec: 1.64, type: "Quadruplet APO flat-field", notes: "Cerchio immagine 44 mm, full-frame ready, self-flattened" },
  { id: "newton-150-750", name: "N 150/750", brand: "Sky-Watcher / Bresser / TS-Photon", apertureMm: 150, focalMm: 750, focalRatio: "f/5", resolutionArcsec: 0.77, type: "Newton parabolico", notes: "Ottimo rapporto luce/prezzo per visuale e astrofotografia entry-level" },
  { id: "capricorn-70", name: "Sky-Watcher Capricorn-70", brand: "Sky-Watcher", apertureMm: 70, focalMm: 900, focalRatio: "f/12.8", resolutionArcsec: 1.66, type: "Achromat", notes: "Focale lunga per Luna e pianeti" },
  { id: "redcat-51", name: "William Optics RedCat 51", brand: "William Optics", apertureMm: 51, focalMm: 250, focalRatio: "f/4.9", resolutionArcsec: 2.28, type: "Petzval APO wide-field", notes: "Campo largo" },
  { id: "askar-fra-300", name: "Askar FRA300", brand: "Askar", apertureMm: 60, focalMm: 300, focalRatio: "f/5", resolutionArcsec: 1.9, type: "Flat-field APO", notes: "Serie FRA: 300 / 400 / 500 mm" },
  { id: "askar-fra-400", name: "Askar FRA400", brand: "Askar", apertureMm: 72, focalMm: 400, focalRatio: "f/5.6", resolutionArcsec: 1.6, type: "Flat-field APO", notes: "Serie FRA" },
  { id: "askar-fra-500", name: "Askar FRA500", brand: "Askar", apertureMm: 90, focalMm: 500, focalRatio: "f/5.6", resolutionArcsec: 1.25, type: "Flat-field APO", notes: "Serie FRA" },
  { id: "evostar-72ed", name: "Sky-Watcher Evostar 72ED", brand: "Sky-Watcher", apertureMm: 72, focalMm: 420, focalRatio: "f/5.8", resolutionArcsec: 1.6, type: "ED doublet", notes: "Economico" },
  { id: "evostar-80ed", name: "Sky-Watcher Evostar 80ED", brand: "Sky-Watcher", apertureMm: 80, focalMm: 600, focalRatio: "f/7.5", resolutionArcsec: 1.45, type: "ED doublet", notes: "Economico" },
  { id: "sv503-80ed", name: "SVBONY SV503 80ED", brand: "SVBONY", apertureMm: 80, focalMm: 560, focalRatio: "f/7", resolutionArcsec: 1.45, type: "ED doublet budget", notes: "" },
  { id: "sv503-102ed", name: "SVBONY SV503 102ED", brand: "SVBONY", apertureMm: 102, focalMm: 714, focalRatio: "f/7", resolutionArcsec: 1.14, type: "ED doublet budget", notes: "" },
  { id: "esprit-80", name: "Sky-Watcher Esprit 80ED", brand: "Sky-Watcher", apertureMm: 80, focalMm: 400, focalRatio: "f/5", resolutionArcsec: 1.45, type: "Triplet APO", notes: "" },
  { id: "esprit-100", name: "Sky-Watcher Esprit 100ED", brand: "Sky-Watcher", apertureMm: 100, focalMm: 550, focalRatio: "f/5.5", resolutionArcsec: 1.16, type: "Triplet APO", notes: "" },
  { id: "sqa-85", name: "Askar SQA85", brand: "Askar", apertureMm: 85, focalMm: 480, focalRatio: "f/5.6", resolutionArcsec: 1.36, type: "Quintuplet flat-field", notes: "" },
  { id: "sqa-106", name: "Askar SQA106", brand: "Askar", apertureMm: 106, focalMm: 509, focalRatio: "f/4.8", resolutionArcsec: 1.09, type: "Quintuplet flat-field", notes: "" },
  { id: "quattro-150", name: "Sky-Watcher Quattro 150P", brand: "Sky-Watcher", apertureMm: 150, focalMm: 600, focalRatio: "f/4", resolutionArcsec: 0.77, type: "Newton veloce", notes: "Astrofotografia" },
  { id: "quattro-200", name: "Sky-Watcher Quattro 200P", brand: "Sky-Watcher", apertureMm: 200, focalMm: 800, focalRatio: "f/4", resolutionArcsec: 0.58, type: "Newton veloce", notes: "Astrofotografia" },
  { id: "c8-edgehd8", name: "Celestron C8 / EdgeHD 8", brand: "Celestron", apertureMm: 203, focalMm: 2032, focalRatio: "f/10", resolutionArcsec: 0.57, type: "SCT", notes: "" },
  { id: "c11-edgehd11", name: "Celestron C11 / EdgeHD 11", brand: "Celestron", apertureMm: 279, focalMm: 2800, focalRatio: "f/10", resolutionArcsec: 0.41, type: "SCT", notes: "" },
  { id: "classic-200p", name: "Sky-Watcher 200P / Classic 200P", brand: "Sky-Watcher", apertureMm: 200, focalMm: 1200, focalRatio: "f/6", resolutionArcsec: 0.58, type: "Dobson / Newton", notes: "Visuale" },
  { id: "fsq-85", name: "Takahashi FSQ-85", brand: "Takahashi", apertureMm: 85, focalMm: 450, focalRatio: "f/5.3", resolutionArcsec: 1.36, type: "Petzval premium", notes: "" },
  { id: "fsq-106", name: "Takahashi FSQ-106", brand: "Takahashi", apertureMm: 106, focalMm: 530, focalRatio: "f/5", resolutionArcsec: 1.09, type: "Petzval premium", notes: "" },
];

const zwo: CameraPreset[] = [
  ["ASI662MC",1920,1080,2.9,2.1,"~199 USD"], ["ASI664MC",2704,1536,2.9,4.15,"~300–349 USD"], ["ASI715MC",3864,2192,1.45,8.5,"~229 USD"], ["ASI678MC",3840,2160,2,8.3,"~314–350 USD"], ["ASI585MC",3840,2160,2.9,8.3,"~399 USD"], ["ASI585MC Pro",3840,2160,2.9,8.3,"~599 USD"], ["ASI676MC",3552,3552,2,12.6,"~399 USD"], ["ASI533MC Pro",3008,3008,3.76,9,"~799 USD"], ["ASI294MC Pro",4144,2822,4.63,11.7,"~999–1100 USD"], ["ASI2600MC Pro",6248,4176,3.76,26,"~1499 USD"], ["ASI2600MM Pro",6248,4176,3.76,26,"~1999 USD"], ["ASI6200MC Pro",9576,6388,3.76,61,"~3800–4000 USD"], ["ASI6200MM Pro",9576,6388,3.76,61,"~3800–4000 USD"], ["ASI4400MC Pro",10000,4400,4.4,44,"~2999 USD"], ["ASI120MM Mini",1280,960,3.75,1.23,"~230 EUR"], ["ASI174MM",1936,1216,5.86,2.35,"~500–600 USD"], ["ASI183MC/MM Pro",5496,3672,2.4,20.18,"~800–1000 USD"], ["ASI482MC",1920,1080,5.8,2.1,"~349 USD"],
].map(([name,x,y,px,mp,price]) => ({ id: `zwo-${String(name).toLowerCase().replace(/[^a-z0-9]+/g,"-")}`, name: String(name), brand: "ZWO", resXpx: Number(x), resYpx: Number(y), pixelUm: Number(px), megapixels: Number(mp), price: String(price) }));
zwo.push({ id: "canon-eos-1100d", name: "Canon EOS 1100D", brand: "Canon", resXpx: 4272, resYpx: 2848, pixelUm: 5.2, megapixels: 12.2, price: "Usata / variabile", notes: "APS-C DSLR; risoluzione ufficiale 4272×2848" });
const svbony: CameraPreset[] = [
  ["SV505C",2712,1538,2.9,4.2,"~150–200 USD"], ["SV705C",3856,2180,2.9,8.3,"~280–350 USD"], ["SC715C",3864,2192,1.45,8.5,"~200–250 USD"], ["SV405CC",4144,2822,4.63,11.7,"~700–850 USD"], ["SV605CC",3008,3008,3.76,9,"~510–650 USD"], ["SV605MC",3008,3008,3.76,9,"~650–800 USD"], ["SC571CC",6224,4168,3.76,26,"~1300–1500 USD"],
].map(([name,x,y,px,mp,price]) => ({ id: `svbony-${String(name).toLowerCase()}`, name: String(name), brand: "SVBONY", resXpx: Number(x), resYpx: Number(y), pixelUm: Number(px), megapixels: Number(mp), price: String(price) }));
export const CAMERA_PRESETS: CameraPreset[] = [...zwo, ...svbony];
