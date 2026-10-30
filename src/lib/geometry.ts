import type { Instance } from "@/types/design";

export type Vec2 = { x: number; y: number };
type Rect = Pick<Instance, "x" | "y" | "rotation" | "width" | "depth">;

export const GRID = 0.5; // metres
export const ROTATION_SNAP = 15; // degrees

const rad = (deg: number) => (deg * Math.PI) / 180;

/** Corners of the item's footprint, in booth metres. */
export function corners(r: Rect): Vec2[] {
  const c = Math.cos(rad(r.rotation));
  const s = Math.sin(rad(r.rotation));
  const hw = r.width / 2;
  const hd = r.depth / 2;
  return [
    [-hw, -hd],
    [hw, -hd],
    [hw, hd],
    [-hw, hd],
  ].map(([lx, ly]) => ({ x: r.x + lx * c - ly * s, y: r.y + lx * s + ly * c }));
}

/** Half-size of the axis-aligned box around the rotated footprint. */
export function halfExtents(r: Pick<Rect, "rotation" | "width" | "depth">) {
  const c = Math.abs(Math.cos(rad(r.rotation)));
  const s = Math.abs(Math.sin(rad(r.rotation)));
  return {
    hx: (r.width * c + r.depth * s) / 2,
    hy: (r.width * s + r.depth * c) / 2,
  };
}

/** Snap one axis so the nearer of the two box edges lands on a grid line. */
function snapAxis(centre: number, half: number, step: number) {
  const fromMin = Math.round((centre - half) / step) * step + half;
  const fromMax = Math.round((centre + half) / step) * step - half;
  return Math.abs(fromMin - centre) <= Math.abs(fromMax - centre) ? fromMin : fromMax;
}

export function snapPosition(r: Rect, x: number, y: number, step = GRID): Vec2 {
  const { hx, hy } = halfExtents(r);
  return { x: round(snapAxis(x, hx, step)), y: round(snapAxis(y, hy, step)) };
}

export function snapRotation(deg: number, step = ROTATION_SNAP) {
  return normaliseRotation(Math.round(deg / step) * step);
}

export function normaliseRotation(deg: number) {
  const d = ((deg % 360) + 360) % 360;
  return round(d);
}

/** Round to millimetres to keep stored numbers tidy. */
export function round(v: number) {
  return Math.round(v * 1000) / 1000;
}

/** True when two convex polygons overlap by more than `eps` (separating axis test). */
export function polygonsOverlap(a: Vec2[], b: Vec2[], eps = 1e-3) {
  for (const poly of [a, b]) {
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i];
      const q = poly[(i + 1) % poly.length];
      const axis = { x: -(q.y - p.y), y: q.x - p.x };
      const len = Math.hypot(axis.x, axis.y) || 1;
      axis.x /= len;
      axis.y /= len;
      const project = (pts: Vec2[]) => {
        let min = Infinity;
        let max = -Infinity;
        for (const pt of pts) {
          const d = pt.x * axis.x + pt.y * axis.y;
          if (d < min) min = d;
          if (d > max) max = d;
        }
        return [min, max] as const;
      };
      const [aMin, aMax] = project(a);
      const [bMin, bMax] = project(b);
      if (aMax - bMin <= eps || bMax - aMin <= eps) return false;
    }
  }
  return true;
}

export function pointInPolygon(pt: Vec2, poly: Vec2[]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > pt.y !== b.y > pt.y && pt.x < ((b.x - a.x) * (pt.y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside;
    }
  }
  return inside;
}
