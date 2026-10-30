"use client";

import { useRef } from "react";
import type { CatalogueItem } from "@/types/design";
import { DRAG_MIME } from "@/lib/catalogue";
import { hasIso, isoUrl } from "@/lib/assets";

interface Props {
  item: CatalogueItem;
  onAdd: (id: string) => void;
  /** HTML drag-and-drop only works with a mouse, so it is off on touch screens. */
  draggable: boolean;
}

/** IKEA-style product card: picture, name and real size. Click adds, drag drops onto the plan. */
export function ProductCard({ item, onAdd, draggable }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const image = item.asset && hasIso(item.asset) ? isoUrl(item.asset, "SW") : null;

  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData(DRAG_MIME, item.id);
        e.dataTransfer.effectAllowed = "copy";
        if (imgRef.current) e.dataTransfer.setDragImage(imgRef.current, 40, 40);
      }}
      onClick={() => onAdd(item.id)}
      title={`Add ${item.name}`}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-stone-200 bg-white text-left transition hover:border-stone-400 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-accent active:scale-[0.98]"
    >
      <div className="grid aspect-[4/3] w-full place-items-center bg-stone-50 p-2">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element -- tiny pre-optimised WebP; next/image adds nothing here
          <img
            ref={imgRef}
            src={image}
            alt=""
            width={80}
            height={80}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="h-full max-h-20 w-full object-contain transition group-hover:scale-105"
          />
        ) : (
          <GeneratedSwatch item={item} />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-0.5 p-2">
        <span className="line-clamp-2 text-xs font-semibold leading-tight text-stone-900">{item.name}</span>
        <span className="text-[10px] tabular-nums text-stone-500">
          {fmt(item.width)} × {fmt(item.depth)} × {fmt(item.height)} m
        </span>
      </div>
      <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-stone-900 text-sm font-medium text-white opacity-0 shadow transition group-hover:opacity-100 group-focus-visible:opacity-100">
        +
      </span>
    </button>
  );
}

const fmt = (v: number) => String(Number(v.toFixed(2)));

/** Generated items (walls, counters, floors) have no picture: draw a small box in their colour. */
function GeneratedSwatch({ item }: { item: CatalogueItem }) {
  const max = Math.max(item.width, item.depth, item.height);
  const w = Math.max(8, (item.width / max) * 56);
  const h = Math.max(4, (item.height / max) * 56);
  const d = Math.max(3, (item.depth / max) * 20);
  return (
    <div className="relative" style={{ width: w + d, height: h + d }}>
      <div className="absolute rounded-[2px] ring-1 ring-black/15" style={{ left: d, top: 0, width: w, height: d, background: item.defaultColor, filter: "brightness(1.08)", transform: "skewX(-45deg)", transformOrigin: "bottom left" }} />
      <div className="absolute rounded-[2px] ring-1 ring-black/15" style={{ left: 0, top: d, width: w, height: h, background: item.defaultColor }} />
    </div>
  );
}
