import manifest from "./assetManifest.json";

/**
 * URLs for the optimised assets in /public/assets, produced by `npm run assets`.
 * Each URL carries a content hash (?v=...) so browsers can cache it for a year.
 */
const files = manifest as Record<string, string>;

export type IsoDir = "SW" | "NW" | "NE" | "SE";

function assetUrl(path: string) {
  const hash = files[path];
  return `/assets/${path}${hash ? `?v=${hash}` : ""}`;
}

export const modelUrl = (key: string) => assetUrl(`models/${key}.glb`);
export const sideUrl = (key: string) => assetUrl(`side/${key}.webp`);
export const isoUrl = (key: string, dir: IsoDir = "SW") => assetUrl(`iso/${key}_${dir}.webp`);

export const hasSide = (key: string) => `side/${key}.webp` in files;
export const hasIso = (key: string) => `iso/${key}_SW.webp` in files;

/**
 * Isometric angle that matches an item's rotation. The images run clockwise
 * SW → NW → NE → SE, the same way rotation runs on the plan; SW shows the front.
 */
export function isoDirForRotation(rotation: number): IsoDir {
  const dirs: IsoDir[] = ["SW", "NW", "NE", "SE"];
  const quarter = Math.round((((rotation % 360) + 360) % 360) / 90) % 4;
  return dirs[quarter];
}
