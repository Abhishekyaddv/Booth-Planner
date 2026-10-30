"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Group, Layer, Line, Rect, Shape, Stage, Text, Transformer, Circle } from "react-konva";
import Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { useDesignStore } from "@/store/designStore";
import { DRAG_MIME, getComponent, layerOf } from "@/lib/catalogue";
import { validate } from "@/lib/rules";
import { GRID, ROTATION_SNAP, round, snapPosition, snapRotation } from "@/lib/geometry";
import type { Instance, Side } from "@/types/design";


// Keep touch events flowing while the stage is being dragged, so a second
// finger can turn a one-finger pan into a pinch zoom.
Konva.hitOnDragEnabled = true;

const ACCENT = "#2563eb";
const DANGER = "#dc2626";
const MIN_SCALE = 15; // px per metre
const MAX_SCALE = 400;
const PADDING = 70;
const FONT = "var(--font-geist-sans), system-ui, sans-serif";
const ROTATION_SNAPS = Array.from({ length: 360 / ROTATION_SNAP }, (_, i) => i * ROTATION_SNAP);
const LAYER_ORDER = { floor: 0, object: 1, overhead: 2 } as const;

type ViewState = { scale: number; x: number; y: number };

export default function Canvas2D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const nodes = useRef(new Map<string, Konva.Group>());

  const design = useDesignStore((s) => s.design);
  const selectedId = useDesignStore((s) => s.selectedId);
  const select = useDesignStore((s) => s.select);
  const updateInstance = useDesignStore((s) => s.updateInstance);
  const addItem = useDesignStore((s) => s.addItem);
  const snapOn = useDesignStore((s) => s.snap);

  const [size, setSize] = useState({ width: 0, height: 0 });
  // Touch screens get bigger transformer handles.
  const [coarse] = useState(() => window.matchMedia("(pointer: coarse)").matches);
  const pinchDist = useRef<number | null>(null);
  // User pan/zoom. It is dropped when the booth size changes, so the plan re-fits.
  const [userView, setUserView] = useState<(ViewState & { key: string }) | null>(null);
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null);

  const { width: W, depth: D } = design.envelope;

  // Track container size.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width: Math.floor(width), height: Math.floor(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const viewKey = `${W}x${D}`;
  const view: ViewState | null = useMemo(() => {
    if (userView && userView.key === viewKey) return userView;
    if (!size.width || !size.height) return null;
    const fitScale = Math.min((size.width - PADDING * 2) / W, (size.height - PADDING * 2) / D);
    const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, fitScale));
    return { scale, x: (size.width - W * scale) / 2, y: (size.height - D * scale) / 2 };
  }, [userView, viewKey, size.width, size.height, W, D]);

  const setView = (fn: (v: ViewState) => ViewState) => {
    if (view) setUserView({ ...fn(view), key: viewKey });
  };
  const fit = () => setUserView(null);

  const shown = useMemo(() => {
    if (!drag) return design;
    return {
      ...design,
      instances: design.instances.map((i) => (i.id === drag.id ? { ...i, x: drag.x, y: drag.y } : i)),
    };
  }, [design, drag]);
  const issues = useMemo(() => validate(shown), [shown]);

  const sorted = useMemo(
    () =>
      [...design.instances].sort(
        (a, b) => LAYER_ORDER[layerOf(getComponent(a.componentId))] - LAYER_ORDER[layerOf(getComponent(b.componentId))],
      ),
    [design.instances],
  );

  const selected = design.instances.find((i) => i.id === selectedId);
  const selectedComp = selected ? getComponent(selected.componentId) : undefined;
  const resizable = selectedComp?.resizable ?? ["width", "depth", "height"];

  // Attach the transformer to the selected node.
  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;
    const node = selectedId ? nodes.current.get(selectedId) : undefined;
    tr.nodes(node ? [node] : []);
    tr.getLayer()?.batchDraw();
  }, [selectedId, design, view]);

  if (!view) {
    return <div ref={containerRef} className="absolute inset-0" />;
  }

  const s = view.scale;

  const zoomBy = (factor: number, pointer = { x: size.width / 2, y: size.height / 2 }) => {
    setView((v) => {
      const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, v.scale * factor));
      const mx = (pointer.x - v.x) / v.scale;
      const my = (pointer.y - v.y) / v.scale;
      return { scale, x: pointer.x - mx * scale, y: pointer.y - my * scale };
    });
  };

  const onWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const pointer = stageRef.current?.getPointerPosition();
    if (pointer) zoomBy(e.evt.deltaY > 0 ? 1 / 1.1 : 1.1, pointer);
  };

  // Two-finger pinch zoom (one finger still pans the plan or drags an item).
  const onTouchMove = (e: KonvaEventObject<TouchEvent>) => {
    const touches = e.evt.touches;
    const stage = stageRef.current;
    if (touches.length !== 2 || !stage) return;
    e.evt.preventDefault();
    if (stage.isDragging()) stage.stopDrag();
    const rect = stage.container().getBoundingClientRect();
    const [a, b] = [touches[0], touches[1]].map((t) => ({ x: t.clientX - rect.left, y: t.clientY - rect.top }));
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinchDist.current) zoomBy(dist / pinchDist.current, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    pinchDist.current = dist;
  };
  const onTouchEnd = () => {
    pinchDist.current = null;
  };

  const onStageMouseDown = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    // Empty space, or the booth flooring before it has been selected (double-click selects it).
    if (e.target === e.target.getStage() || e.target.findAncestor(".passthrough")) select(null);
  };

  const onStageDragEnd = (e: KonvaEventObject<DragEvent>) => {
    if (e.target !== e.target.getStage()) return;
    setView((v) => ({ ...v, x: e.target.x(), y: e.target.y() }));
  };

  const toMetres = (node: Konva.Node) => ({ x: node.x() / s, y: node.y() / s });

  const onItemDragMove = (inst: Instance) => (e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    const node = e.target;
    let { x, y } = toMetres(node);
    if (snapOn && !e.evt.shiftKey) {
      ({ x, y } = snapPosition(inst, x, y));
      node.position({ x: x * s, y: y * s });
    }
    setDrag({ id: inst.id, x: round(x), y: round(y) });
  };

  const onItemDragEnd = (inst: Instance) => (e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    const { x, y } = toMetres(e.target);
    setDrag(null);
    updateInstance(inst.id, { x: round(x), y: round(y) });
  };

  const onTransformEnd = () => {
    if (!selected) return;
    const node = nodes.current.get(selected.id);
    if (!node) return;
    const sx = node.scaleX();
    const sy = node.scaleY();
    node.scale({ x: 1, y: 1 });
    // Only the dimension being dragged changes; lengths snap to 5 cm.
    const resize = (value: number, factor: number) =>
      Math.abs(factor - 1) < 1e-3 ? value : Math.max(0.05, round(Math.round((value * factor) / 0.05) * 0.05));
    updateInstance(selected.id, {
      x: round(node.x() / s),
      y: round(node.y() / s),
      rotation: snapRotation(node.rotation()),
      width: resize(selected.width, sx),
      depth: resize(selected.depth, sy),
    });
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData(DRAG_MIME);
    const comp = getComponent(id);
    const stage = stageRef.current;
    if (!comp || !stage) return;
    stage.setPointersPositions(e.nativeEvent);
    const p = stage.getPointerPosition();
    if (!p) return;
    let x = (p.x - view.x) / s;
    let y = (p.y - view.y) / s;
    if (snapOn && !e.shiftKey) ({ x, y } = snapPosition({ ...comp, x, y, rotation: 0 }, x, y));
    addItem(id, { x, y });
  };

  // Visible grid range (in metres), extended past the booth.
  const x0 = Math.floor(-view.x / s / GRID) * GRID;
  const x1 = Math.ceil((size.width - view.x) / s / GRID) * GRID;
  const y0 = Math.floor(-view.y / s / GRID) * GRID;
  const y1 = Math.ceil((size.height - view.y) / s / GRID) * GRID;
  // The whole grid is one Shape (two strokes) instead of ~100 Line nodes.
  const drawGrid = (ctx: Konva.Context, major: boolean) => {
    ctx.beginPath();
    for (let gx = x0; gx <= x1 + 1e-6; gx += GRID) {
      if ((Math.abs(gx % 1) < 1e-6) !== major) continue;
      ctx.moveTo(gx * s, y0 * s);
      ctx.lineTo(gx * s, y1 * s);
    }
    for (let gy = y0; gy <= y1 + 1e-6; gy += GRID) {
      if ((Math.abs(gy % 1) < 1e-6) !== major) continue;
      ctx.moveTo(x0 * s, gy * s);
      ctx.lineTo(x1 * s, gy * s);
    }
    ctx.lineWidth = major ? 1 : 0.75;
    ctx.strokeStyle = major ? "#d6d3d1" : "#e7e5e4";
    ctx.stroke();
  };

  const edges: { side: Side; pts: number[] }[] = [
    { side: "back", pts: [0, 0, W * s, 0] },
    { side: "right", pts: [W * s, 0, W * s, D * s] },
    { side: "front", pts: [W * s, D * s, 0, D * s] },
    { side: "left", pts: [0, D * s, 0, 0] },
  ];

  const anchors = [
    ...(resizable.includes("width") ? ["middle-left", "middle-right"] : []),
    ...(resizable.includes("depth") ? ["top-center", "bottom-center"] : []),
  ];

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 touch-none"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes(DRAG_MIME)) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }
      }}
      onDrop={onDrop}
    >
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        x={view.x}
        y={view.y}
        draggable
        onWheel={onWheel}
        onMouseDown={onStageMouseDown}
        onTouchStart={onStageMouseDown}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onDragEnd={onStageDragEnd}
        style={{ cursor: "grab" }}
      >
        <Layer listening={false}>
          <Rect x={0} y={0} width={W * s} height={D * s} fill="#ffffff" shadowColor="#000" shadowOpacity={0.06} shadowBlur={12} />
          <Shape
            perfectDrawEnabled={false}
            sceneFunc={(ctx) => {
              drawGrid(ctx, false);
              drawGrid(ctx, true);
            }}
          />
          <Rect x={0} y={0} width={W * s} height={D * s} fill="rgba(250,250,249,0.35)" />
        </Layer>

        <Layer>
          {sorted.map((inst) => (
            <ItemShape
              key={inst.id}
              inst={inst}
              scale={s}
              selected={inst.id === selectedId}
              invalid={!!issues[inst.id]}
              registerNode={(n) => (n ? nodes.current.set(inst.id, n) : nodes.current.delete(inst.id))}
              onSelect={() => select(inst.id)}
              onDragMove={onItemDragMove(inst)}
              onDragEnd={onItemDragEnd(inst)}
            />
          ))}
          <Transformer
            ref={trRef}
            rotateEnabled
            rotationSnaps={ROTATION_SNAPS}
            rotationSnapTolerance={ROTATION_SNAP / 2}
            enabledAnchors={anchors}
            keepRatio={false}
            flipEnabled={false}
            ignoreStroke
            borderStroke={ACCENT}
            anchorStroke={ACCENT}
            anchorSize={coarse ? 14 : 8}
            anchorCornerRadius={4}
            rotateAnchorOffset={coarse ? 36 : 24}
            boundBoxFunc={(oldBox, newBox) => (newBox.width < 4 || newBox.height < 2 ? oldBox : newBox)}
            onTransformEnd={onTransformEnd}
          />
        </Layer>

        <Layer listening={false}>
          {edges.map(({ side, pts }) => {
            const open = design.envelope.openSides[side];
            return (
              <Line
                key={side}
                points={pts}
                stroke={open ? ACCENT : "#292524"}
                strokeWidth={open ? 2 : 5}
                dash={open ? [10, 7] : undefined}
                lineCap="square"
              />
            );
          })}
          <Text x={0} y={-24} width={W * s} align="center" text={`${W} m`} fontSize={12} fontStyle="600" fill="#57534e" fontFamily={FONT} />
          <Text x={-24} y={D * s} width={D * s} align="center" rotation={-90} text={`${D} m`} fontSize={12} fontStyle="600" fill="#57534e" fontFamily={FONT} />
          <Text
            x={0}
            y={D * s + 12}
            width={W * s}
            align="center"
            text={design.envelope.openSides.front ? "FRONT · AISLE" : "FRONT"}
            fontSize={10}
            letterSpacing={1.5}
            fill="#a8a29e"
            fontFamily={FONT}
          />
        </Layer>
      </Stage>

      <div className="pointer-events-none absolute bottom-3 left-3 hidden rounded-md bg-white/90 px-2.5 py-1.5 text-[11px] text-stone-500 shadow-sm ring-1 ring-stone-200 lg:block">
        Grid 0.5 m · <span className="font-semibold text-stone-700">solid</span> = wall ·{" "}
        <span className="font-semibold text-accent">dashed</span> = open side · double-click flooring to select it
      </div>
      <div className="absolute bottom-20 right-3 flex items-center overflow-hidden rounded-md bg-white text-sm shadow-sm ring-1 ring-stone-200 lg:bottom-3">
        <button onClick={() => zoomBy(1 / 1.2)} className="h-8 w-8 hover:bg-stone-50" aria-label="Zoom out">−</button>
        <span className="w-14 text-center text-xs tabular-nums text-stone-500">{Math.round(s)} px/m</span>
        <button onClick={() => zoomBy(1.2)} className="h-8 w-8 hover:bg-stone-50" aria-label="Zoom in">+</button>
        <button onClick={fit} className="h-8 border-l border-stone-200 px-3 text-xs font-medium hover:bg-stone-50">Fit</button>
      </div>
    </div>
  );
}

interface ItemProps {
  inst: Instance;
  scale: number;
  selected: boolean;
  invalid: boolean;
  registerNode: (node: Konva.Group | null) => void;
  onSelect: () => void;
  onDragMove: (e: KonvaEventObject<DragEvent>) => void;
  onDragEnd: (e: KonvaEventObject<DragEvent>) => void;
}

function ItemShape({ inst, scale: s, selected, invalid, registerNode, onSelect, onDragMove, onDragEnd }: ItemProps) {
  const comp = getComponent(inst.componentId);
  const layer = layerOf(comp);
  const w = inst.width * s;
  const d = Math.max(inst.depth * s, 2);
  const isFlooring = inst.componentId === "flooring";
  // Floor-layer items only drag once selected, so dragging the floor pans the plan instead.
  const draggable = layer !== "floor" || selected;

  const stroke = invalid ? DANGER : selected ? ACCENT : shade(inst.color, -0.35);
  const fill = invalid ? "#fecaca" : inst.color;
  const opacity = layer === "floor" ? 0.35 : layer === "overhead" ? 0.85 : 0.75;
  const textColor = luminance(inst.color) < 0.4 && !invalid ? "#ffffff" : "#1c1917";
  const showLabel = w > 34 && d > 16 && (layer !== "floor" || selected || !isFlooring);
  const label = comp?.name ?? inst.componentId;

  const handleSelect = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    e.cancelBubble = true;
    onSelect();
  };

  return (
    <Group
      ref={registerNode}
      name={isFlooring && !selected ? "passthrough" : undefined}
      x={inst.x * s}
      y={inst.y * s}
      rotation={inst.rotation}
      draggable={draggable}
      onMouseDown={isFlooring && !selected ? undefined : handleSelect}
      onTouchStart={isFlooring && !selected ? undefined : handleSelect}
      onDblClick={handleSelect}
      onDblTap={handleSelect}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onMouseEnter={(e) => {
        const c = e.target.getStage()?.container();
        if (c && draggable) c.style.cursor = "move";
      }}
      onMouseLeave={(e) => {
        const c = e.target.getStage()?.container();
        if (c) c.style.cursor = "grab";
      }}
    >
      <Rect
        perfectDrawEnabled={false}
        x={-w / 2}
        y={-d / 2}
        width={w}
        height={d}
        fill={layer === "overhead" ? undefined : fill}
        opacity={opacity}
        cornerRadius={comp?.kind === "model" ? Math.min(3, w / 6, d / 6) : 0}
      />
      <Rect
        perfectDrawEnabled={false}
        x={-w / 2}
        y={-d / 2}
        width={w}
        height={d}
        stroke={stroke}
        strokeWidth={selected || invalid ? 2 : 1.25}
        dash={layer === "overhead" ? [6, 4] : layer === "floor" ? [3, 3] : undefined}
        strokeScaleEnabled={false}
        cornerRadius={comp?.kind === "model" ? Math.min(3, w / 6, d / 6) : 0}
      />
      {/* Front edge marker: rotation 0 faces the front of the booth. */}
      {layer === "object" && d > 8 && (
        <Line points={[-w / 2 + 3, d / 2 - 2, w / 2 - 3, d / 2 - 2]} stroke={stroke} strokeWidth={2.5} opacity={0.8} strokeScaleEnabled={false} />
      )}
      {showLabel && (
        // Keep text readable: flip it when the item is turned more than 90° either way.
        <Group listening={false} rotation={inst.rotation > 90 && inst.rotation <= 270 ? 180 : 0}>
          <Text
            x={-w / 2 + 2}
            y={-(d > 30 ? 13 : 6)}
            width={w - 4}
            align="center"
            text={label}
            fontSize={11}
            fontStyle="600"
            fill={textColor}
            fontFamily={FONT}
            wrap="none"
            ellipsis
          />
          {d > 30 && (
            <Text
              x={-w / 2 + 2}
              y={1}
              width={w - 4}
              align="center"
              text={`${fmt(inst.width)} × ${fmt(inst.depth)}`}
              fontSize={10}
              fill={textColor}
              opacity={0.75}
              fontFamily={FONT}
              wrap="none"
              ellipsis
            />
          )}
        </Group>
      )}
      {invalid && (
        <Group x={w / 2} y={-d / 2} rotation={-inst.rotation} listening={false}>
          <Circle radius={8} fill={DANGER} stroke="#fff" strokeWidth={1.5} />
          <Text x={-8} y={-6} width={16} align="center" text="!" fontSize={12} fontStyle="bold" fill="#fff" fontFamily={FONT} />
        </Group>
      )}
    </Group>
  );
}

const fmt = (v: number) => `${Number(v.toFixed(2))}`;

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/** Lighten (amount > 0) or darken (amount < 0) a hex colour. */
function shade(hex: string, amount: number) {
  const [r, g, b] = hexToRgb(hex).map((c) => Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount));
  return `rgb(${r},${g},${b})`;
}
