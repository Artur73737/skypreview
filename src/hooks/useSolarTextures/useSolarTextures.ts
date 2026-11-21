import { useSyncExternalStore } from "react";
import { SOLAR_BODIES, type SolarTextures } from "../../services/solarSystem";

let textures: SolarTextures = { images: {}, ringAlpha: null };
let started = false;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function startLoading(): void {
  if (started || typeof Image === "undefined") return;
  started = true;
  const base = `${import.meta.env.BASE_URL}textures/solar-system/`;

  for (const definition of SOLAR_BODIES) {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      textures = { ...textures, images: { ...textures.images, [definition.id]: image } };
      emit();
    };
    image.src = `${base}${definition.texture}`;
  }

  const ring = new Image();
  ring.decoding = "async";
  ring.onload = () => {
    textures = { ...textures, ringAlpha: ring };
    emit();
  };
  ring.src = `${base}2k_saturn_ring_alpha.png`;
}

function subscribe(listener: () => void): () => void {
  startLoading();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): SolarTextures {
  return textures;
}

export function useSolarTextures(): SolarTextures {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
