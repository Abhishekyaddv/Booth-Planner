"use client";

import { useCallback, useEffect } from "react";
import { useDesignStore } from "@/store/designStore";
import { loadProject, saveProject } from "@/lib/persistence";

const AUTOSAVE_MS = 600;

const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/**
 * Restores the last design from localStorage on first load, then saves it
 * whenever the design or project name changes.
 */
export function useAutosave() {
  const ready = useDesignStore((s) => s.hydrated);
  const savedLabel = useDesignStore((s) => s.saveStatus);

  useEffect(() => {
    const store = useDesignStore.getState();
    const saved = loadProject();
    if (saved) store.loadDesign(saved.design, saved.projectName);
    // Restoring should not be an undoable step.
    useDesignStore.temporal.getState().clear();
    store.setPersistence({
      hydrated: true,
      saveStatus: saved ? `Restored ${timeLabel(saved.savedAt)}` : null,
    });

    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = useDesignStore.subscribe((state, prev) => {
      if (state.design === prev.design && state.projectName === prev.projectName) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        const at = saveProject(state.projectName, state.design);
        state.setPersistence({ saveStatus: at ? `Autosaved ${timeLabel(at)}` : "Autosave failed" });
      }, AUTOSAVE_MS);
    });
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const saveNow = useCallback(() => {
    const { projectName, design, setPersistence } = useDesignStore.getState();
    const at = saveProject(projectName, design);
    setPersistence({ saveStatus: at ? `Saved ${timeLabel(at)}` : "Save failed" });
  }, []);

  return { ready, savedLabel, saveNow };
}
