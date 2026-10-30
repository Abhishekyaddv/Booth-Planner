"use client";

import { useEffect } from "react";
import { useDesignStore } from "@/store/designStore";
import { normaliseRotation, round } from "@/lib/geometry";

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
}

/** Global keyboard shortcuts for the planner. */
export function usePlannerShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      const store = useDesignStore.getState();
      const temporal = useDesignStore.temporal.getState();
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (mod && key === "z") {
        e.preventDefault();
        if (e.shiftKey) temporal.redo();
        else temporal.undo();
        return;
      }
      if (mod && key === "y") {
        e.preventDefault();
        temporal.redo();
        return;
      }

      const sel = store.design.instances.find((i) => i.id === store.selectedId);
      if (!sel) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        store.removeInstance(sel.id);
      } else if (e.key === "Escape") {
        store.select(null);
      } else if (mod && key === "d") {
        e.preventDefault();
        store.duplicateInstance(sel.id);
      } else if (!mod && key === "r") {
        store.updateInstance(sel.id, { rotation: normaliseRotation(sel.rotation + (e.shiftKey ? -15 : 15)) });
      } else if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        const step = e.shiftKey ? 0.5 : 0.1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        store.updateInstance(sel.id, { x: round(sel.x + dx), y: round(sel.y + dy) });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
