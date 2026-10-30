"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useDesignStore } from "@/store/designStore";
import { useSelectedInstance } from "@/store/hooks";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { TopBar } from "./TopBar";
import { CatalogueSidebar } from "./CatalogueSidebar";
import { CataloguePanel } from "./catalogue/CataloguePanel";
import { PropertiesContent, PropertiesPanel } from "./PropertiesPanel";
import { MobileActionBar } from "./MobileActionBar";
import { usePlannerShortcuts } from "./usePlannerShortcuts";
import { useAutosave } from "./useAutosave";

// Each view loads only when first shown (Konva, three.js, SVG). ssr:false keeps
// the canvas libraries out of the server render.
const Canvas2D = dynamic(() => import("./Canvas2D"), { ssr: false, loading: () => <CanvasLoading /> });
const Scene3D = dynamic(() => import("./Scene3D"), { ssr: false, loading: () => <CanvasLoading /> });
const ElevationView = dynamic(() => import("./ElevationView"), { ssr: false, loading: () => <CanvasLoading /> });

export function PlannerApp() {
  const view = useDesignStore((s) => s.view);
  const { ready, savedLabel, saveNow } = useAutosave();
  const [sheet, setSheet] = useState<"catalogue" | "properties" | null>(null);
  const selected = useSelectedInstance();
  usePlannerShortcuts();

  return (
    // dvh: on phones the browser bar doesn't cover the bottom of the app.
    <div className="flex h-dvh flex-col overflow-hidden">
      <TopBar onSave={saveNow} savedLabel={savedLabel} />
      <div className="flex min-h-0 flex-1">
        <CatalogueSidebar />
        <main className="relative min-w-0 flex-1 bg-stone-100">
          {!ready ? <CanvasLoading /> : view === "2d" ? <Canvas2D /> : view === "3d" ? <Scene3D /> : <ElevationView />}
          <MobileActionBar onAdd={() => setSheet("catalogue")} onMore={() => setSheet("properties")} />
        </main>
        <PropertiesPanel />
      </div>

      {/* Phones and tablets: catalogue and properties open as bottom sheets */}
      <BottomSheet open={sheet === "catalogue"} onClose={() => setSheet(null)} title="Add components">
        <CataloguePanel touch onAdded={() => setSheet(null)} />
      </BottomSheet>
      <BottomSheet open={sheet === "properties"} onClose={() => setSheet(null)} title={selected ? "Item details" : "Booth summary"}>
        <div className="h-full overflow-y-auto">
          <PropertiesContent />
        </div>
      </BottomSheet>
    </div>
  );
}

function CanvasLoading() {
  return <div className="grid h-full place-items-center text-sm text-stone-400">Loading…</div>;
}
