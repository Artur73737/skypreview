import type { HipsCutout } from "./hips";
import type { TileWorkerRequest, TileWorkerResponse } from "./tiles.worker";
import { composeHipsTexture } from "./tiles";

let worker: Worker | null = null;
let workerFailed = false;
let nextId = 0;
const pending = new Map<number, (response: TileWorkerResponse) => void>();

function getWorker(): Worker | null {
  if (workerFailed || typeof Worker === "undefined" || typeof OffscreenCanvas === "undefined") return null;
  if (worker) return worker;
  try {
    worker = new Worker(new URL("./tiles.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = ({ data }: MessageEvent<TileWorkerResponse>) => {
      const deliver = pending.get(data.id);
      if (deliver) deliver(data);
      else if ("bitmap" in data) data.bitmap.close();
    };
    worker.onerror = () => {
      worker?.terminate();
      worker = null;
      workerFailed = true;
      for (const [id, deliver] of pending) deliver({ id, error: "DSS2 worker unavailable" });
    };
  } catch {
    workerFailed = true;
  }
  return worker;
}

export async function loadHipsTexture(
  cutout: HipsCutout,
  signal?: AbortSignal,
  maxOrder = 9,
): Promise<HTMLCanvasElement> {
  signal?.throwIfAborted();
  const background = getWorker();
  if (!background) return await composeHipsTexture(cutout, signal, maxOrder) as HTMLCanvasElement;

  try {
    const bitmap = await new Promise<ImageBitmap>((resolve, reject) => {
      const id = nextId++;
      const cleanup = () => {
        pending.delete(id);
        signal?.removeEventListener("abort", abort);
      };
      const abort = () => {
        cleanup();
        background.postMessage({ id, cancel: true } satisfies TileWorkerRequest);
        reject(signal?.reason);
      };
      signal?.addEventListener("abort", abort, { once: true });
      pending.set(id, response => {
        cleanup();
        if ("bitmap" in response) resolve(response.bitmap);
        else reject(new Error(response.error));
      });
      background.postMessage({ id, cutout, maxOrder } satisfies TileWorkerRequest);
    });
    try {
      signal?.throwIfAborted();
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const renderer = canvas.getContext("bitmaprenderer");
      if (renderer) renderer.transferFromImageBitmap(bitmap);
      else canvas.getContext("2d")?.drawImage(bitmap, 0, 0);
      return canvas;
    } finally {
      bitmap.close();
    }
  } catch (error) {
    if (!workerFailed || signal?.aborted) throw error;
    return await composeHipsTexture(cutout, signal, maxOrder) as HTMLCanvasElement;
  }
}
