"use client";

import { useDesignStore } from "@/store/designStore";
import { NumberField } from "@/components/ui/NumberField";
import { TEMPLATES } from "@/lib/templates";
import type { Side } from "@/types/design";

export function BoothSetup() {
  const envelope = useDesignStore((s) => s.design.envelope);
  const setEnvelope = useDesignStore((s) => s.setEnvelope);
  const toggleSide = useDesignStore((s) => s.toggleSide);
  const applyTemplate = useDesignStore((s) => s.applyTemplate);
  const snap = useDesignStore((s) => s.snap);
  const setSnap = useDesignStore((s) => s.setSnap);

  const sideButton = (side: Side, className: string) => {
    const open = envelope.openSides[side];
    return (
      <button
        onClick={() => toggleSide(side)}
        title={`${side} side: ${open ? "open to aisle" : "closed (wall)"}`}
        className={`${className} rounded text-[10px] font-medium capitalize transition ${
          open ? "border border-dashed border-accent bg-accent-soft text-accent" : "bg-stone-700 text-white"
        }`}
      >
        {side}
      </button>
    );
  };

  return (
    <div className="space-y-5">
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Templates</h3>
        <div className="space-y-1.5">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                if (confirm(`Load "${t.name}"? This replaces the current design (you can undo).`)) applyTemplate(t.id);
              }}
              className="w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-left hover:border-accent hover:bg-accent-soft/40"
            >
              <div className="text-sm font-medium text-stone-800">{t.name}</div>
              <div className="text-xs text-stone-500">{t.description}</div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Booth size</h3>
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="Width" value={envelope.width} step={0.5} min={1} max={30} onCommit={(width) => setEnvelope({ width })} />
          <NumberField label="Depth" value={envelope.depth} step={0.5} min={1} max={30} onCommit={(depth) => setEnvelope({ depth })} />
        </div>
        <div className="mt-2">
          <NumberField label="Wall height" value={envelope.height} step={0.1} min={2} max={6} onCommit={(height) => setEnvelope({ height })} />
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Open sides</h3>
        <div className="grid grid-cols-[44px_1fr_44px] grid-rows-[22px_56px_22px] gap-1">
          {sideButton("back", "col-start-2 row-start-1")}
          {sideButton("left", "col-start-1 row-start-2 [writing-mode:vertical-rl] rotate-180")}
          <div className="col-start-2 row-start-2 grid place-items-center rounded bg-stone-100 text-[11px] text-stone-500">
            booth
          </div>
          {sideButton("right", "col-start-3 row-start-2 [writing-mode:vertical-rl]")}
          {sideButton("front", "col-start-2 row-start-3")}
        </div>
        <p className="mt-1.5 text-[11px] text-stone-500">Dashed = open to the aisle. Front is the bottom edge of the plan.</p>
      </section>

      <label className="flex items-center gap-2 text-sm text-stone-700">
        <input type="checkbox" checked={snap} onChange={(e) => setSnap(e.target.checked)} className="accent-accent" />
        Snap to 0.5 m grid <span className="text-xs text-stone-400">(hold Shift to override)</span>
      </label>
    </div>
  );
}
