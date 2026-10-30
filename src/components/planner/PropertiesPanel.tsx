"use client";

import { useDesignStore } from "@/store/designStore";
import { useIssues, useSelectedInstance } from "@/store/hooks";
import { CATALOGUE, SUBCATEGORIES, getComponent, layerOf } from "@/lib/catalogue";
import { hasIso, isoDirForRotation, isoUrl } from "@/lib/assets";
import { describeIssue } from "@/lib/rules";
import { normaliseRotation, round } from "@/lib/geometry";
import { boothType, formatM } from "@/lib/summary";
import { NumberField } from "@/components/ui/NumberField";
import { ColorInput } from "@/components/ui/ColorInput";
import { CopyIcon, RotateIcon, TrashIcon, WarningIcon } from "@/components/ui/icons";
import type { Instance } from "@/types/design";

const SWATCHES = ["#ffffff", "#f4f4f2", "#1c1917", "#2563eb", "#dc2626", "#f59e0b", "#16a34a", "#e6994f", "#5c85de", "#f05e57"];

/** Desktop right panel. On smaller screens the same content opens in a bottom sheet. */
export function PropertiesPanel() {
  return (
    <aside className="hidden w-72 shrink-0 flex-col overflow-y-auto border-l border-stone-200 bg-white lg:flex">
      <PropertiesContent />
    </aside>
  );
}

/** Selected item's properties, or the booth summary when nothing is selected. */
export function PropertiesContent() {
  const selected = useSelectedInstance();
  return selected ? <ItemProperties inst={selected} /> : <BoothSummary />;
}

const FACING = ["the aisle (front)", "left", "the back", "right"];

/** Isometric picture that turns with the item, so you can see which way it faces. */
function ItemPreview({ asset, rotation }: { asset: string; rotation: number }) {
  const dir = isoDirForRotation(rotation);
  const quarter = ["SW", "NW", "NE", "SE"].indexOf(dir);
  return (
    <div className="flex items-center gap-3 rounded-lg bg-stone-50 p-2">
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny pre-optimised WebP */}
      <img src={isoUrl(asset, dir)} alt="" width={72} height={72} decoding="async" className="h-18 w-18 shrink-0 object-contain" />
      <p className="text-xs leading-snug text-stone-500">
        Facing <span className="font-medium text-stone-700">{FACING[quarter]}</span>
        <br />
        Rotate to turn it.
      </p>
    </div>
  );
}

function ItemProperties({ inst }: { inst: Instance }) {
  const update = useDesignStore((s) => s.updateInstance);
  const remove = useDesignStore((s) => s.removeInstance);
  const duplicate = useDesignStore((s) => s.duplicateInstance);
  const design = useDesignStore((s) => s.design);
  const issues = useIssues()[inst.id] ?? [];
  const comp = getComponent(inst.componentId);
  const resizable = comp?.resizable ?? ["width", "depth", "height"];
  const variants = CATALOGUE.filter((c) => c.category === comp?.category);
  const set = (patch: Partial<Instance>) => update(inst.id, patch);

  const changeVariant = (componentId: string) => {
    const next = getComponent(componentId);
    if (!next) return;
    set({ componentId, width: next.width, depth: next.depth, height: next.height, color: next.defaultColor });
  };

  return (
    <div className="space-y-5 p-4">
      <div>
        <div className="text-[11px] font-medium uppercase tracking-wide text-stone-500">{comp?.category}</div>
        <h2 className="text-lg font-semibold text-stone-900">{comp?.name ?? inst.componentId}</h2>
        <div className="text-xs text-stone-500">
          {comp?.kind === "model" ? "3D model" : comp?.kind === "wall" ? "Wall (generated)" : "Box (generated)"}
          {layerOf(comp) !== "object" && ` · ${layerOf(comp)} layer`}
        </div>
      </div>

      {comp?.asset && hasIso(comp.asset) && <ItemPreview asset={comp.asset} rotation={inst.rotation} />}

      {issues.length > 0 && (
        <div className="space-y-1 rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
          {issues.map((issue, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <WarningIcon width={14} height={14} className="mt-px shrink-0" />
              {describeIssue(issue, design)}
            </div>
          ))}
        </div>
      )}

      <Field label="Variant">
        <select
          value={inst.componentId}
          onChange={(e) => changeVariant(e.target.value)}
          className="h-8 w-full rounded-md border border-stone-200 bg-white px-2 text-sm outline-none focus:border-accent"
        >
          {comp &&
            SUBCATEGORIES[comp.category].map((sub) => {
              const group = variants.filter((v) => v.subcategory === sub);
              return group.length ? (
                <optgroup key={sub} label={sub}>
                  {group.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </optgroup>
              ) : null;
            })}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <NumberField label="X" value={inst.x} step={0.1} onCommit={(x) => set({ x })} />
        <NumberField label="Y" value={inst.y} step={0.1} onCommit={(y) => set({ y })} />
      </div>

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <NumberField label="Rotation" unit="°" value={inst.rotation} step={15} onCommit={(r) => set({ rotation: normaliseRotation(r) })} />
        </div>
        <button
          onClick={() => set({ rotation: normaliseRotation(inst.rotation + 90) })}
          title="Rotate 90°"
          className="grid h-8 w-8 place-items-center rounded-md border border-stone-200 text-stone-600 hover:bg-stone-50"
        >
          <RotateIcon />
        </button>
      </div>

      <div>
        <div className="grid grid-cols-3 gap-2">
          <NumberField label="Width" value={inst.width} compact step={0.1} min={0.05} max={30} disabled={!resizable.includes("width")} onCommit={(width) => set({ width })} />
          <NumberField label="Depth" value={inst.depth} compact step={0.1} min={0.01} max={30} disabled={!resizable.includes("depth")} onCommit={(depth) => set({ depth })} />
          <NumberField label="Height" value={inst.height} compact step={0.1} min={0.01} max={6} disabled={!resizable.includes("height")} onCommit={(height) => set({ height })} />
        </div>
        {comp && (comp.width !== inst.width || comp.depth !== inst.depth || comp.height !== inst.height) && (
          <button
            onClick={() => set({ width: comp.width, depth: comp.depth, height: comp.height })}
            className="mt-1.5 text-xs font-medium text-accent hover:underline"
          >
            Reset to standard size ({comp.width} × {comp.depth} × {comp.height} m)
          </button>
        )}
      </div>

      <Field label="Colour">
        <div className="flex flex-wrap items-center gap-1.5">
          {SWATCHES.map((c) => (
            <button
              key={c}
              onClick={() => set({ color: c })}
              title={c}
              style={{ background: c }}
              className={`h-6 w-6 rounded-full ring-1 ring-black/10 ${inst.color.toLowerCase() === c ? "outline-2 outline-offset-2 outline-accent" : ""}`}
            />
          ))}
          <ColorInput value={inst.color} onChange={(color) => set({ color })} />
        </div>
      </Field>

      <div className="flex gap-2 border-t border-stone-100 pt-4">
        <button
          onClick={() => duplicate(inst.id)}
          className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-stone-200 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          <CopyIcon /> Duplicate
        </button>
        <button
          onClick={() => remove(inst.id)}
          className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <TrashIcon /> Delete
        </button>
      </div>
      <p className="hidden text-[11px] leading-relaxed text-stone-400 lg:block">
        Shortcuts: Delete removes · R rotates 15° · arrows nudge 0.1 m (Shift 0.5 m) · Ctrl+D duplicates · Esc deselects
      </p>
    </div>
  );
}

function BoothSummary() {
  const design = useDesignStore((s) => s.design);
  const select = useDesignStore((s) => s.select);
  const issues = useIssues();
  const { envelope, instances } = design;
  const area = envelope.width * envelope.depth;
  const objects = instances.filter((i) => layerOf(getComponent(i.componentId)) === "object");
  const footprint = objects.reduce((sum, i) => sum + i.width * i.depth, 0);
  const counts = new Map<string, number>();
  for (const i of instances) {
    const cat = getComponent(i.componentId)?.category ?? "Other";
    counts.set(cat, (counts.get(cat) ?? 0) + 1);
  }
  const problemIds = Object.keys(issues);
  const openList = (Object.keys(envelope.openSides) as (keyof typeof envelope.openSides)[]).filter((s) => envelope.openSides[s]);

  return (
    <div className="space-y-5 p-4">
      <div>
        <div className="text-[11px] font-medium uppercase tracking-wide text-stone-500">Booth summary</div>
        <h2 className="text-lg font-semibold text-stone-900">{boothType(envelope)} booth</h2>
      </div>

      <dl className="grid grid-cols-2 gap-2">
        <Stat label="Size" value={`${envelope.width} × ${envelope.depth} m`} />
        <Stat label="Floor area" value={`${area.toFixed(1)} m²`} />
        <Stat label="Wall height" value={formatM(envelope.height)} />
        <Stat label="Items" value={String(instances.length)} />
        <Stat label="Furniture footprint" value={`${round(footprint).toFixed(1)} m²`} />
        <Stat label="Floor used" value={`${Math.round((footprint / area) * 100)}%`} />
      </dl>

      <div>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">Open sides</h3>
        <p className="text-sm capitalize text-stone-700">{openList.length ? openList.join(", ") : "None"}</p>
      </div>

      {counts.size > 0 && (
        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">By category</h3>
          <ul className="space-y-0.5 text-sm text-stone-700">
            {[...counts].map(([cat, n]) => (
              <li key={cat} className="flex justify-between">
                <span>{cat}</span>
                <span className="tabular-nums text-stone-500">{n}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">Checks</h3>
        {problemIds.length === 0 ? (
          <p className="rounded-md bg-emerald-50 p-2.5 text-sm text-emerald-700">All items fit inside the booth with no overlaps.</p>
        ) : (
          <ul className="space-y-1">
            {problemIds.map((id) => {
              const inst = instances.find((i) => i.id === id);
              if (!inst) return null;
              return (
                <li key={id}>
                  <button
                    onClick={() => select(id)}
                    className="flex w-full items-start gap-1.5 rounded-md bg-red-50 p-2 text-left text-xs text-red-700 hover:bg-red-100"
                  >
                    <WarningIcon width={14} height={14} className="mt-px shrink-0" />
                    <span>
                      <b>{getComponent(inst.componentId)?.name}</b>: {describeIssue(issues[id][0], design)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <p className="text-[11px] leading-relaxed text-stone-400">Select an item to edit it. Scroll to zoom, drag empty space to pan.</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-stone-500">{label}</span>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-stone-50 p-2">
      <dt className="text-[10px] uppercase tracking-wide text-stone-500">{label}</dt>
      <dd className="text-sm font-semibold tabular-nums text-stone-800">{value}</dd>
    </div>
  );
}
