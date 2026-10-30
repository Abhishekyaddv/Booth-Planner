"use client";

import { useMemo } from "react";
import { useDesignStore } from "@/store/designStore";
import { useIssues } from "@/store/hooks";
import { getComponent, layerOf } from "@/lib/catalogue";
import { baseElevation } from "@/lib/rules";
import { halfExtents, normaliseRotation } from "@/lib/geometry";
import { hasSide, sideUrl } from "@/lib/assets";
import { usePanZoom } from "./usePanZoom";

const ACCENT = "#2563eb";
const DANGER = "#dc2626";
const WALL_T = 0.06;
const MARGIN = 0.7; // metres of space around the booth
const FONT = "var(--font-geist-sans), system-ui, sans-serif";

type Face = "front" | "back" | "side";

/** Which way the item shows to someone standing in the aisle. */
function faceOf(rotation: number): Face {
  const r = normaliseRotation(rotation);
  if (r <= 20 || r >= 340) return "front";
  if (r >= 160 && r <= 200) return "back";
  return "side";
}

/**
 * Front elevation: the booth as seen from the aisle, at real scale.
 * Models facing the aisle use their Kenney "Side" picture; everything else is
 * drawn as a flat panel in its colour. Plain SVG, no canvas library.
 */
export default function ElevationView() {
  const design = useDesignStore((s) => s.design);
  const selectedId = useDesignStore((s) => s.selectedId);
  const select = useDesignStore((s) => s.select);
  const issues = useIssues();
  const pz = usePanZoom();
  const { width: W, height: H, openSides } = design.envelope;

  const items = useMemo(() => {
    return design.instances
      .filter((inst) => layerOf(getComponent(inst.componentId)) !== "floor" || inst.componentId === "platform")
      .map((inst) => {
        const comp = getComponent(inst.componentId);
        const { hx } = halfExtents(inst);
        const face = faceOf(inst.rotation);
        const base = baseElevation(inst, design);
        const image = comp?.kind === "model" && comp.asset && face !== "side" && hasSide(comp.asset) ? sideUrl(comp.asset) : null;
        return { inst, comp, left: inst.x - hx, width: hx * 2, base, face, image };
      })
      // Back of the booth first, so things nearer the aisle are drawn on top.
      .sort((a, b) => {
        const la = layerOf(a.comp) === "overhead" ? 1 : 0;
        const lb = layerOf(b.comp) === "overhead" ? 1 : 0;
        return la - lb || a.inst.y - b.inst.y || a.base - b.base;
      });
  }, [design]);

  const top = H + 0.3 + 0.5;
  const viewBox = `${-MARGIN} ${-top} ${W + MARGIN * 2} ${top + 0.75}`;
  const t = (v: number) => -v; // metres above the floor → SVG y

  return (
    <div
      className="absolute inset-0 touch-none select-none overflow-hidden bg-stone-100"
      {...pz.handlers}
      onClick={() => {
        if (!pz.wasGesture()) select(null);
      }}
    >
      <svg
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full"
        style={{ transform: `translate(${pz.view.x}px, ${pz.view.y}px) scale(${pz.view.scale})`, transformOrigin: "center" }}
        role="img"
        aria-label="Front elevation of the booth"
      >
        {/* Hall floor and booth floor */}
        <rect x={-MARGIN} y={0} width={W + MARGIN * 2} height={0.75} fill="#e7e5e4" />
        <rect x={0} y={0} width={W} height={0.03} fill="#a8a29e" />

        {/* Back shell wall as the backdrop, side walls as thin edges */}
        {openSides.back ? (
          <rect x={0} y={t(H)} width={W} height={H} fill="none" stroke="#a8a29e" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
        ) : (
          <rect x={0} y={t(H)} width={W} height={H} fill="#fbfbfa" stroke="#d6d3d1" vectorEffect="non-scaling-stroke" />
        )}
        {!openSides.left && <rect x={-WALL_T} y={t(H)} width={WALL_T} height={H} fill="#e7e5e4" stroke="#a8a29e" vectorEffect="non-scaling-stroke" />}
        {!openSides.right && <rect x={W} y={t(H)} width={WALL_T} height={H} fill="#e7e5e4" stroke="#a8a29e" vectorEffect="non-scaling-stroke" />}

        {items.map(({ inst, comp, left, width, base, face, image }) => {
          const selected = inst.id === selectedId;
          const invalid = !!issues[inst.id];
          const y = t(base + inst.height);
          const onClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (!pz.wasGesture()) select(inst.id);
          };
          return (
            <g key={inst.id} onClick={onClick} className="cursor-pointer">
              {image ? (
                <image
                  href={image}
                  x={left}
                  y={y}
                  width={width}
                  height={inst.height}
                  preserveAspectRatio="none"
                  // Seen from behind: mirror the front picture.
                  transform={face === "back" ? `translate(${left * 2 + width} 0) scale(-1 1)` : undefined}
                />
              ) : (
                <>
                  <rect x={left} y={y} width={width} height={inst.height} fill={inst.color} stroke="rgba(0,0,0,0.25)" vectorEffect="non-scaling-stroke" />
                  {width > 0.35 && inst.height > 0.18 && (
                    <text
                      x={left + width / 2}
                      y={y + Math.min(inst.height / 2, 0.25)}
                      fontSize={Math.min(0.12, inst.height * 0.4)}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={isDark(inst.color) ? "#fff" : "#44403c"}
                      fontFamily={FONT}
                      pointerEvents="none"
                    >
                      {comp?.name}
                    </text>
                  )}
                </>
              )}
              {(selected || invalid) && (
                <rect
                  x={left - 0.02}
                  y={y - 0.02}
                  width={width + 0.04}
                  height={inst.height + 0.04}
                  fill={invalid ? "rgba(220,38,38,0.08)" : "none"}
                  stroke={invalid ? DANGER : ACCENT}
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                  pointerEvents="none"
                />
              )}
            </g>
          );
        })}

        {/* Dimensions */}
        <g fill="#57534e" fontFamily={FONT} fontSize={0.13} pointerEvents="none">
          <line x1={0} y1={0.3} x2={W} y2={0.3} stroke="#78716c" vectorEffect="non-scaling-stroke" />
          <line x1={0} y1={0.22} x2={0} y2={0.38} stroke="#78716c" vectorEffect="non-scaling-stroke" />
          <line x1={W} y1={0.22} x2={W} y2={0.38} stroke="#78716c" vectorEffect="non-scaling-stroke" />
          <text x={W / 2} y={0.52} textAnchor="middle">{`${W} m`}</text>
          <line x1={-0.35} y1={0} x2={-0.35} y2={t(H)} stroke="#78716c" vectorEffect="non-scaling-stroke" />
          <line x1={-0.43} y1={t(H)} x2={-0.27} y2={t(H)} stroke="#78716c" vectorEffect="non-scaling-stroke" />
          <text x={-0.45} y={t(H / 2)} textAnchor="middle" transform={`rotate(-90 -0.45 ${t(H / 2)})`}>{`${H} m`}</text>
        </g>
      </svg>

      <div className="pointer-events-none absolute left-3 top-3 rounded-md bg-white/90 px-2.5 py-1.5 text-xs font-semibold text-stone-700 shadow-sm ring-1 ring-stone-200">
        Front elevation · seen from the aisle
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 hidden max-w-md rounded-md bg-white/90 px-2.5 py-1.5 text-[11px] text-stone-500 shadow-sm ring-1 ring-stone-200 lg:block">
        Real scale. Pictures show each model&apos;s standard colour; custom colours appear in 2D and 3D. Items turned sideways are drawn as panels.
      </div>
      <div className="absolute bottom-20 right-3 flex items-center overflow-hidden lg:bottom-3 rounded-md bg-white text-sm shadow-sm ring-1 ring-stone-200" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
        <button onClick={() => pz.zoomBy(1 / 1.2)} className="h-8 w-8 hover:bg-stone-50" aria-label="Zoom out">−</button>
        <button onClick={() => pz.zoomBy(1.2)} className="h-8 w-8 hover:bg-stone-50" aria-label="Zoom in">+</button>
        <button onClick={pz.reset} className="h-8 border-l border-stone-200 px-3 text-xs font-medium hover:bg-stone-50">Fit</button>
      </div>
    </div>
  );
}

function isDark(hex: string) {
  const n = parseInt(hex.replace("#", "").padEnd(6, "0").slice(0, 6), 16);
  const lum = (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  return lum < 0.45;
}
