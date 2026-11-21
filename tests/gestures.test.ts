import { describe, expect, it } from "vitest";
import { clampFov, fovForPinch, MAX_FOV_DEG, MIN_FOV_DEG } from "../src/components/SkyView/pinch";

describe("touch pinch zoom", () => {
  it("zooms in when the fingers move apart", () => {
    expect(fovForPinch(20, 100, 200)).toBeCloseTo(10, 6);
  });

  it("zooms out when the fingers move together", () => {
    expect(fovForPinch(20, 200, 100)).toBeCloseTo(40, 6);
  });

  it("clamps the field of view to the supported range", () => {
    expect(fovForPinch(0.1, 20, 20000)).toBe(MIN_FOV_DEG);
    expect(fovForPinch(100, 20000, 20)).toBe(MAX_FOV_DEG);
  });

  it("keeps the current field of view for invalid distances", () => {
    expect(fovForPinch(35, 0, 120)).toBe(35);
    expect(fovForPinch(35, 120, Number.NaN)).toBe(35);
  });

  it("clamps wheel zoom through the shared helper", () => {
    expect(clampFov(0.0001)).toBe(MIN_FOV_DEG);
    expect(clampFov(400)).toBe(MAX_FOV_DEG);
    expect(clampFov(42)).toBe(42);
  });
});
