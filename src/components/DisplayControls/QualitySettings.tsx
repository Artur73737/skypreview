import { defaultQuality, qualityRanges, type ImageQuality } from "../../store/skyStore/imageQuality";
import { useSkyStore } from "../../store/skyStore";

const sliders = [
  ["exposure", "Map exposure (stops)"],
  ["highlights", "Highlight compression"],
  ["gamma", "Midtone gamma"],
  ["saturation", "Color saturation"],
  ["pixelRatio", "Display pixel ratio limit"],
  ["maxOrder", "Maximum HiPS tile order"],
  ["previewSize", "Object preview size (px)"],
] as const;

export function QualitySettings() {
  const { sky, update } = useSkyStore();
  const { quality } = sky;
  const set = (patch: Partial<ImageQuality>) => update({ quality: { ...quality, ...patch } });
  return (
    <div className="quality-settings">
      <label>
        <span>Map texture size</span>
        <select value={quality.textureSize} onChange={event => set({ textureSize: Number(event.target.value) })}>
          <option value={0}>Auto (1024â€“2048 px)</option>
          {Array.from({ length: 15 }, (_, i) => 512 + i * 256).map(size => (
            <option key={size} value={size}>{size} Ã— {size}</option>
          ))}
        </select>
      </label>
      <label className="quality-toggle"><input type="checkbox" checked={quality.sourceColors}
        onChange={event => set({ sourceColors: event.target.checked })} /> Use original DSS2 colors</label>
      {sliders.map(([key, label]) => {
        const [min, max, step] = qualityRanges[key];
        return <label key={key}>
          <span>{label}</span><output>{quality[key]}</output>
          <input type="range" aria-label={label} min={min} max={max} step={step}
            disabled={quality.sourceColors && ["exposure", "highlights", "gamma", "saturation"].includes(key)}
            value={quality[key]} onChange={event => set({ [key]: Number(event.target.value) })} />
        </label>;
      })}
      <label className="quality-toggle"><input type="checkbox" checked={quality.smooth}
        onChange={event => set({ smooth: event.target.checked })} /> Smooth texture sampling</label>
      <label className="quality-toggle"><input type="checkbox" checked={quality.localPack}
        disabled={quality.sourceColors || quality.textureSize !== 0 || quality.maxOrder !== 9}
        onChange={event => set({ localPack: event.target.checked })} /> Use prebuilt textures in Auto</label>
      <button onClick={() => update({ quality: { ...defaultQuality } })}>Reset image settings</button>
    </div>
  );
}
