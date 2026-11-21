import { composeHipsTexture } from "./tiles";
import type { HipsCutout } from "./hips";

export type TileWorkerRequest =
  | { id: number; cutout: HipsCutout; maxOrder: number }
  | { id: number; cancel: true };
export type TileWorkerResponse =
  | { id: number; bitmap: ImageBitmap }
  | { id: number; error: string };

const jobs = new Map<number, AbortController>();
self.addEventListener("message", async (event: MessageEvent<TileWorkerRequest>) => {
  const request = event.data;
  if ("cancel" in request) {
    jobs.get(request.id)?.abort();
    return;
  }
  const controller = new AbortController();
  jobs.set(request.id, controller);
  try {
    const canvas = await composeHipsTexture(request.cutout, controller.signal, request.maxOrder);
    if (controller.signal.aborted) return;
    const bitmap = await createImageBitmap(canvas);
    if (controller.signal.aborted) {
      bitmap.close();
      return;
    }
    self.postMessage({ id: request.id, bitmap } satisfies TileWorkerResponse, { transfer: [bitmap] });
  } catch (error) {
    if (!controller.signal.aborted)
      self.postMessage({ id: request.id, error: String(error) } satisfies TileWorkerResponse);
  } finally {
    jobs.delete(request.id);
  }
});
