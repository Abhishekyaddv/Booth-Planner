"use client";

import { useEffect, useRef } from "react";
import { useDesignStore } from "@/store/designStore";

interface Props {
  value: string;
  onChange: (color: string) => void;
}

/**
 * Native colour picker that previews live while dragging, but records a single
 * undo step when the picker is closed.
 */
export function ColorInput({ value, onChange }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const editingFrom = useRef<string | null>(null); // colour before this edit began
  const latest = useRef({ value, onChange });
  useEffect(() => {
    latest.current = { value, onChange };
    // Keep the swatch in sync with outside changes (undo, other item selected).
    if (editingFrom.current === null && ref.current) ref.current.value = value;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const temporal = useDesignStore.temporal;

    const onInput = () => {
      if (editingFrom.current === null) {
        editingFrom.current = latest.current.value;
        temporal.getState().pause();
      }
      latest.current.onChange(el.value);
    };
    const onCommit = () => {
      const start = editingFrom.current;
      if (start === null) return;
      editingFrom.current = null;
      const final = el.value;
      latest.current.onChange(start); // back to the starting colour, untracked
      temporal.getState().resume();
      if (final !== start) latest.current.onChange(final); // one tracked step
    };
    el.addEventListener("input", onInput);
    el.addEventListener("change", onCommit);
    el.addEventListener("blur", onCommit);
    return () => {
      el.removeEventListener("input", onInput);
      el.removeEventListener("change", onCommit);
      el.removeEventListener("blur", onCommit);
      if (editingFrom.current !== null) temporal.getState().resume();
    };
  }, []);

  return (
    <input
      ref={ref}
      type="color"
      defaultValue={value}
      className="h-6 w-8 cursor-pointer rounded border border-stone-200 bg-white"
      title="Custom colour"
    />
  );
}
