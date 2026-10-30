"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useStore } from "zustand";
import { useDesignStore, type ViewMode } from "@/store/designStore";
import { boothType } from "@/lib/summary";
import { downloadJson } from "@/lib/persistence";
import { DownloadIcon, RedoIcon, ResetIcon, SaveIcon, UndoIcon } from "@/components/ui/icons";
import { prefetch2D, prefetch3D, prefetchElevation } from "./prefetch";

interface Props {
  onSave: () => void;
  savedLabel: string | null;
}

const VIEWS: { id: ViewMode; label: string; short: string; prefetch: () => void }[] = [
  { id: "2d", label: "2D", short: "2D", prefetch: prefetch2D },
  { id: "3d", label: "3D", short: "3D", prefetch: prefetch3D },
  { id: "elevation", label: "Elevation", short: "Front", prefetch: prefetchElevation },
];

export function TopBar({ onSave, savedLabel }: Props) {
  const projectName = useDesignStore((s) => s.projectName);
  const setProjectName = useDesignStore((s) => s.setProjectName);
  const envelope = useDesignStore((s) => s.design.envelope);
  const view = useDesignStore((s) => s.view);
  const setView = useDesignStore((s) => s.setView);
  const reset = useDesignStore((s) => s.reset);
  const temporal = useDesignStore.temporal;
  const canUndo = useStore(temporal, (s) => s.pastStates.length > 0);
  const canRedo = useStore(temporal, (s) => s.futureStates.length > 0);

  const onReset = () => {
    if (confirm("Remove all items from the booth? You can undo this.")) reset();
  };
  const onDownload = () => downloadJson(projectName, useDesignStore.getState().design);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-stone-200 bg-white px-2 sm:gap-3 sm:px-3">
      <Link href="/" className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-accent text-sm font-semibold text-white" title="Home">
        M
      </Link>
      <input
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        className="min-w-0 flex-1 truncate rounded-md border border-transparent px-1.5 py-1 text-sm font-semibold text-stone-900 outline-none hover:border-stone-200 focus:border-accent lg:w-56 lg:flex-none"
        aria-label="Project name"
      />
      <span className="hidden rounded-md bg-stone-100 px-2 py-1 text-xs font-medium tabular-nums text-stone-600 xl:inline">
        {envelope.width} × {envelope.depth} m · {boothType(envelope)} · {(envelope.width * envelope.depth).toFixed(1)} m²
      </span>

      <div className="flex shrink-0 rounded-lg bg-stone-100 p-0.5 text-sm font-medium lg:mx-auto" role="tablist" aria-label="View">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            role="tab"
            aria-selected={view === v.id}
            onClick={() => setView(v.id)}
            onPointerEnter={v.prefetch}
            onFocus={v.prefetch}
            className={`rounded-md px-2.5 py-1 transition sm:px-4 ${view === v.id ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"}`}
          >
            <span className="sm:hidden">{v.short}</span>
            <span className="hidden sm:inline">{v.label}</span>
          </button>
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
        <IconButton label="Undo (Ctrl+Z)" disabled={!canUndo} onClick={() => temporal.getState().undo()}>
          <UndoIcon />
        </IconButton>
        <IconButton label="Redo (Ctrl+Y)" disabled={!canRedo} onClick={() => temporal.getState().redo()}>
          <RedoIcon />
        </IconButton>

        {/* Desktop: everything visible */}
        <div className="hidden items-center gap-1 lg:flex">
          <IconButton label="Reset booth" onClick={onReset}>
            <ResetIcon />
          </IconButton>
          <div className="mx-1 h-6 w-px bg-stone-200" />
          <span className="hidden w-28 text-right text-xs text-stone-400 xl:inline">{savedLabel}</span>
          <button onClick={onSave} className="flex h-8 items-center gap-1.5 rounded-md border border-stone-200 px-3 text-sm font-medium text-stone-700 hover:bg-stone-50">
            <SaveIcon /> Save
          </button>
          <button onClick={onDownload} className="flex h-8 items-center gap-1.5 rounded-md bg-accent px-3 text-sm font-medium text-white hover:bg-accent-hover">
            <DownloadIcon /> Download JSON
          </button>
        </div>

        {/* Mobile and tablet: the rest goes in a menu */}
        <OverflowMenu savedLabel={savedLabel} onReset={onReset} onSave={onSave} onDownload={onDownload} />
      </div>
    </header>
  );
}

function OverflowMenu({ savedLabel, onReset, onSave, onDownload }: { savedLabel: string | null; onReset: () => void; onSave: () => void; onDownload: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const item = (label: string, icon: React.ReactNode, action: () => void) => (
    <button
      role="menuitem"
      onClick={() => {
        setOpen(false);
        action();
      }}
      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-stone-700 hover:bg-stone-50"
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div ref={ref} className="relative lg:hidden">
      <IconButton label="More actions" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </IconButton>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-40 mt-1 w-52 overflow-hidden rounded-lg border border-stone-200 bg-white py-1 shadow-lg">
          {item("Save", <SaveIcon />, onSave)}
          {item("Download JSON", <DownloadIcon />, onDownload)}
          {item("Reset booth", <ResetIcon />, onReset)}
          {savedLabel && <p className="border-t border-stone-100 px-3 py-2 text-xs text-stone-400">{savedLabel}</p>}
        </div>
      )}
    </div>
  );
}

function IconButton({ label, children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      {...rest}
      title={label}
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-md text-stone-600 hover:bg-stone-100 hover:text-stone-900 disabled:pointer-events-none disabled:opacity-30 lg:h-8 lg:w-8"
    >
      {children}
    </button>
  );
}
