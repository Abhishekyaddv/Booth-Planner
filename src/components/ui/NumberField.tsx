"use client";

import { useState } from "react";

interface Props {
  label: string;
  value: number;
  onCommit: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
  disabled?: boolean;
  /** Hide the − / + buttons (for narrow three-column rows). */
  compact?: boolean;
}

/** Number input that commits on Enter / blur, so typing doesn't create an undo step per key. */
export function NumberField({ label, value, onCommit, step = 0.1, min, max, unit = "m", disabled, compact }: Props) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? String(Number(value.toFixed(3)));

  const commit = (raw: string) => {
    setDraft(null);
    let v = parseFloat(raw);
    if (!Number.isFinite(v)) return;
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    if (v !== value) onCommit(Math.round(v * 1000) / 1000);
  };

  const nudge = (dir: 1 | -1) => commit(String(value + dir * step));

  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-stone-500">{label}</span>
      <div
        className={`flex h-8 items-center rounded-md border border-stone-200 bg-white text-sm focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15 ${disabled ? "opacity-50" : ""}`}
      >
        {!compact && <button type="button" tabIndex={-1} disabled={disabled} onClick={() => nudge(-1)} className="h-full px-2 text-stone-400 hover:text-stone-800" aria-label={`Decrease ${label}`}>
          −
        </button>}
        <input
          type="number"
          inputMode="decimal"
          step={step}
          disabled={disabled}
          value={shown}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit((e.target as HTMLInputElement).value);
            if (e.key === "Escape") setDraft(null);
          }}
          className="w-full min-w-0 bg-transparent text-center tabular-nums outline-none"
        />
        <span className={`text-xs text-stone-400 ${compact ? "pr-2" : "pr-1"}`}>{unit}</span>
        {!compact && <button type="button" tabIndex={-1} disabled={disabled} onClick={() => nudge(1)} className="h-full px-2 text-stone-400 hover:text-stone-800" aria-label={`Increase ${label}`}>
          +
        </button>}
      </div>
    </label>
  );
}
