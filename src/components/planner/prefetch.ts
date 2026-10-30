"use client";

import { useDesignStore } from "@/store/designStore";
import { getComponent } from "@/lib/catalogue";

/**
 * Warm up a view before it is opened (on hover or focus of its toggle button).
 * These are the same dynamic imports PlannerApp uses, so the chunks are shared.
 */
export function prefetch3D() {
  const urls = new Set<string>();
  for (const inst of useDesignStore.getState().design.instances) {
    const url = getComponent(inst.componentId)?.modelUrl;
    if (url) urls.add(url);
  }
  // Starts the ~1 MB three.js download plus only the models this design uses.
  void import("./Scene3D").then((m) => m.preloadModels([...urls]));
}

export function prefetchElevation() {
  void import("./ElevationView");
}

export function prefetch2D() {
  void import("./Canvas2D");
}
