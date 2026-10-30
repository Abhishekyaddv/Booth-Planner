"use client";

import { CataloguePanel } from "./catalogue/CataloguePanel";

/** Desktop left sidebar. On smaller screens the same panel opens in a bottom sheet. */
export function CatalogueSidebar() {
  return (
    <aside className="hidden w-80 shrink-0 flex-col border-r border-stone-200 bg-white lg:flex">
      <CataloguePanel />
    </aside>
  );
}
