import { afterEach, describe, expect, it, vi } from "vitest";
import { getHipsCutoutUrl, loadHipsImage } from "../src/services/hips";

afterEach(() => vi.unstubAllGlobals());
describe("DSS2 image requests", () => {
  it("falls back to the mirror and caches decoded images", async () => {
    vi.stubGlobal("Image", class { src = ""; decode = async () => {}; });
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response("unavailable", { status: 503 }))
      .mockResolvedValueOnce(new Response(new Blob(["test image"], { type: "image/jpeg" })));
    vi.stubGlobal("fetch", fetch);
    const cutout = getHipsCutoutUrl(123, 45, 4, 384);
    const img = await loadHipsImage(cutout);
    expect(fetch.mock.calls[1][0]).toContain("alaskybis.cds.unistra.fr");
    expect(await loadHipsImage(cutout)).toBe(img);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it("does not retry obsolete requests on the mirror", async () => {
    const controller = new AbortController();
    controller.abort();
    const fetch = vi.fn().mockRejectedValue(new DOMException("Aborted", "AbortError"));
    vi.stubGlobal("fetch", fetch);
    await expect(loadHipsImage(getHipsCutoutUrl(124,45,4), controller.signal)).rejects.toThrow("Aborted");
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("reports failure when both servers fail instead of silently succeeding", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response("unavailable", { status: 503 }));
    vi.stubGlobal("fetch", fetch);
    await expect(loadHipsImage(getHipsCutoutUrl(125,45,4))).rejects.toThrow("503");
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
