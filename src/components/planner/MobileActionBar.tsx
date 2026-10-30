"use client";

import { useDesignStore } from "@/store/designStore";
import { useIssues, useSelectedInstance } from "@/store/hooks";
import { getComponent } from "@/lib/catalogue";
import { normaliseRotation } from "@/lib/geometry";
import { ColorInput } from "@/components/ui/ColorInput";
import { CopyIcon, RotateIcon, TrashIcon, WarningIcon } from "@/components/ui/icons";

interface Props {
  onAdd: () => void;
  onMore: () => void;
}

/** Bottom controls on phones and tablets: "+ Add", and quick actions for the selected item. */
export function MobileActionBar({ onAdd, onMore }: Props) {
  const selected = useSelectedInstance();
  const update = useDesignStore((s) => s.updateInstance);
  const remove = useDesignStore((s) => s.removeInstance);
  const duplicate = useDesignStore((s) => s.duplicateInstance);
  const issues = useIssues();
  const problemCount = Object.keys(issues).length;

  return (
    <div
      className="pointer-events-none absolute inset-x-3 bottom-3 z-20 flex items-end gap-2 lg:hidden"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="pointer-events-auto min-w-0 flex-1">
        {selected ? (
          <div className="flex items-center gap-1 rounded-xl bg-white p-1.5 shadow-lg ring-1 ring-stone-200">
            <button onClick={onMore} className="min-w-0 flex-1 px-2 text-left">
              <span className="flex items-center gap-1 truncate text-sm font-semibold text-stone-900">
                {issues[selected.id] && <WarningIcon width={14} height={14} className="shrink-0 text-red-600" />}
                <span className="truncate">{getComponent(selected.componentId)?.name}</span>
              </span>
              <span className="block text-[11px] text-stone-500">Tap for details</span>
            </button>
            <BarButton label="Rotate 90°" onClick={() => update(selected.id, { rotation: normaliseRotation(selected.rotation + 90) })}>
              <RotateIcon />
            </BarButton>
            <span className="grid h-10 w-10 place-items-center" title="Colour">
              <ColorInput value={selected.color} onChange={(color) => update(selected.id, { color })} />
            </span>
            <BarButton label="Duplicate" onClick={() => duplicate(selected.id)}>
              <CopyIcon />
            </BarButton>
            <BarButton label="Delete" onClick={() => remove(selected.id)} danger>
              <TrashIcon />
            </BarButton>
          </div>
        ) : (
          <button
            onClick={onMore}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-medium text-stone-700 shadow-lg ring-1 ring-stone-200"
          >
            Booth summary
            {problemCount > 0 && (
              <span className="rounded-full bg-red-100 px-1.5 text-xs font-semibold text-red-700">{problemCount}</span>
            )}
          </button>
        )}
      </div>
      <button
        onClick={onAdd}
        className="pointer-events-auto flex h-12 shrink-0 items-center gap-1.5 rounded-full bg-stone-900 px-5 text-sm font-semibold text-white shadow-lg active:scale-95"
      >
        <span className="text-lg leading-none">+</span> Add
      </button>
    </div>
  );
}

function BarButton({ label, onClick, danger, children }: { label: string; onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${danger ? "text-red-600 hover:bg-red-50" : "text-stone-700 hover:bg-stone-100"}`}
    >
      {children}
    </button>
  );
}
