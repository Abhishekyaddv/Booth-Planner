import { create } from "zustand";
import { temporal } from "zundo";
import type { DesignDocument, Envelope, Instance, Side } from "@/types/design";
import { getComponent } from "@/lib/catalogue";
import { findFreeSpot } from "@/lib/rules";
import { round } from "@/lib/geometry";
import { TEMPLATES, emptyDesign, makeInstance } from "@/lib/templates";

export type ViewMode = "2d" | "3d" | "elevation";

interface DesignState {
  design: DesignDocument;
  selectedId: string | null;
  projectName: string;
  view: ViewMode;
  snap: boolean;
  /** True once the saved design has been restored from localStorage. */
  hydrated: boolean;
  saveStatus: string | null;

  addItem: (componentId: string, at?: { x: number; y: number }) => void;
  updateInstance: (id: string, patch: Partial<Omit<Instance, "id">>) => void;
  removeInstance: (id: string) => void;
  duplicateInstance: (id: string) => void;
  select: (id: string | null) => void;
  setEnvelope: (patch: Partial<Omit<Envelope, "openSides">>) => void;
  toggleSide: (side: Side) => void;
  loadDesign: (design: DesignDocument, projectName?: string) => void;
  applyTemplate: (templateId: string) => void;
  reset: () => void;
  setProjectName: (name: string) => void;
  setView: (view: ViewMode) => void;
  setSnap: (snap: boolean) => void;
  setPersistence: (patch: Partial<Pick<DesignState, "hydrated" | "saveStatus">>) => void;
}

const initialDesign = () => TEMPLATES[0].build();

export const useDesignStore = create<DesignState>()(
  temporal(
    (set, get) => {
      const setDesign = (fn: (d: DesignDocument) => DesignDocument) =>
        set((s) => ({ design: fn(s.design) }));

      return {
        design: initialDesign(),
        selectedId: null,
        projectName: "Messe India booth",
        view: "2d",
        snap: true,
        hydrated: false,
        saveStatus: null,

        addItem: (componentId, at) => {
          const comp = getComponent(componentId);
          if (!comp) return;
          const { design } = get();
          const base = makeInstance(componentId, 0, 0);
          if (comp.id === "flooring") {
            base.width = design.envelope.width;
            base.depth = design.envelope.depth;
          }
          const pos = at ?? findFreeSpot(design, comp, base);
          const inst = { ...base, x: round(pos.x), y: round(pos.y) };
          set({
            design: { ...design, instances: [...design.instances, inst] },
            selectedId: inst.id,
          });
        },

        updateInstance: (id, patch) =>
          setDesign((d) => ({
            ...d,
            instances: d.instances.map((i) => (i.id === id ? { ...i, ...patch } : i)),
          })),

        removeInstance: (id) =>
          set((s) => ({
            design: { ...s.design, instances: s.design.instances.filter((i) => i.id !== id) },
            selectedId: s.selectedId === id ? null : s.selectedId,
          })),

        duplicateInstance: (id) => {
          const src = get().design.instances.find((i) => i.id === id);
          if (!src) return;
          const copy = { ...makeInstance(src.componentId, 0, 0), ...src };
          copy.id = makeInstance(src.componentId, 0, 0).id;
          copy.x = round(src.x + 0.5);
          copy.y = round(src.y + 0.5);
          set((s) => ({
            design: { ...s.design, instances: [...s.design.instances, copy] },
            selectedId: copy.id,
          }));
        },

        select: (id) => set({ selectedId: id }),

        setEnvelope: (patch) =>
          setDesign((d) => ({ ...d, envelope: { ...d.envelope, ...patch } })),

        toggleSide: (side) =>
          setDesign((d) => ({
            ...d,
            envelope: {
              ...d.envelope,
              openSides: { ...d.envelope.openSides, [side]: !d.envelope.openSides[side] },
            },
          })),

        loadDesign: (design, projectName) =>
          set((s) => ({ design, selectedId: null, projectName: projectName ?? s.projectName })),

        applyTemplate: (templateId) => {
          const t = TEMPLATES.find((t) => t.id === templateId);
          if (t) set({ design: t.build(), selectedId: null });
        },

        reset: () => set((s) => ({ design: emptyDesign(s.design.envelope), selectedId: null })),

        setProjectName: (projectName) => set({ projectName }),
        setView: (view) => set({ view }),
        setSnap: (snap) => set({ snap }),
        setPersistence: (patch) => set(patch),
      };
    },
    {
      // Only the design document is part of undo history; selection and view are not.
      partialize: (s) => ({ design: s.design }),
      equality: (a, b) => a.design === b.design,
      limit: 100,
    },
  ),
);

export const useTemporal = () => useDesignStore.temporal;
