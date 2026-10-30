"use client";

import { useRef, useState } from "react";

export type PanZoom = { scale: number; x: number; y: number };

const MIN = 0.5;
const MAX = 6;

/**
 * Pan and zoom for an SVG/HTML view using pointer events, so it works the same
 * with a mouse (drag + wheel) and touch (one-finger pan, two-finger pinch).
 * `x`/`y` are screen-pixel offsets; `scale` multiplies the fitted size.
 */
export function usePanZoom() {
  const [view, setView] = useState<PanZoom>({ scale: 1, x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; scale: number } | null>(null);
  const moved = useRef(false);

  const zoomAt = (factor: number, cx: number, cy: number) =>
    setView((v) => {
      const scale = Math.min(MAX, Math.max(MIN, v.scale * factor));
      const k = scale / v.scale;
      return { scale, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k };
    });

  const local = (e: React.PointerEvent | React.WheelEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return { x: e.clientX - r.left - r.width / 2, y: e.clientY - r.top - r.height / 2 };
  };

  const handlers = {
    onWheel: (e: React.WheelEvent) => {
      const p = local(e);
      zoomAt(e.deltaY > 0 ? 1 / 1.1 : 1.1, p.x, p.y);
    },
    onPointerDown: (e: React.PointerEvent) => {
      pointers.current.set(e.pointerId, local(e));
      moved.current = false;
      if (pointers.current.size === 2) {
        const [a, b] = [...pointers.current.values()];
        pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), scale: view.scale };
      }
    },
    onPointerMove: (e: React.PointerEvent) => {
      const prev = pointers.current.get(e.pointerId);
      if (!prev) return;
      const p = local(e);
      pointers.current.set(e.pointerId, p);
      if (pointers.current.size === 2 && pinch.current) {
        const [a, b] = [...pointers.current.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const target = Math.min(MAX, Math.max(MIN, (pinch.current.scale * dist) / (pinch.current.dist || 1)));
        zoomAt(target / view.scale, (a.x + b.x) / 2, (a.y + b.y) / 2);
        moved.current = true;
      } else if (pointers.current.size === 1) {
        const dx = p.x - prev.x;
        const dy = p.y - prev.y;
        if (Math.abs(dx) + Math.abs(dy) > 0) {
          if (!moved.current && Math.hypot(dx, dy) < 3) return; // ignore tiny jitter before a tap
          moved.current = true;
          (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
          setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
        }
      }
    },
    onPointerUp: (e: React.PointerEvent) => {
      pointers.current.delete(e.pointerId);
      if (pointers.current.size < 2) pinch.current = null;
    },
    onPointerCancel: (e: React.PointerEvent) => {
      pointers.current.delete(e.pointerId);
      pinch.current = null;
    },
  };

  return {
    view,
    handlers,
    /** True if the last gesture panned or pinched (so it should not count as a click). */
    wasGesture: () => moved.current,
    zoomBy: (factor: number) => zoomAt(factor, 0, 0),
    reset: () => setView({ scale: 1, x: 0, y: 0 }),
  };
}
