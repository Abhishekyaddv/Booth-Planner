"use client";

import { useMemo, useState } from "react";
import type { Category } from "@/types/design";
import { CATALOGUE, CATEGORIES, SUBCATEGORIES } from "@/lib/catalogue";
import { useDesignStore } from "@/store/designStore";
import { BoothSetup } from "../BoothSetup";
import { SearchIcon } from "@/components/ui/icons";
import { CategoryDropdown } from "./CategoryDropdown";
import { ProductCard } from "./ProductCard";

interface Props {
  /** Called after an item is added (the mobile sheet closes itself). */
  onAdded?: () => void;
  /** Touch screens can't use HTML drag-and-drop; cards are tap-to-add there. */
  touch?: boolean;
}

/** Components / Booth setup tabs. Used by the desktop sidebar and the mobile sheet. */
export function CataloguePanel({ onAdded, touch = false }: Props) {
  const addItem = useDesignStore((s) => s.addItem);
  const [tab, setTab] = useState<"components" | "booth">("components");
  const [category, setCategory] = useState<Category>("Seating");
  const [sub, setSub] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const add = (id: string) => {
    addItem(id);
    onAdded?.();
  };

  const q = query.trim().toLowerCase();

  // Sections to show: search results by category, one subcategory, or all subcategories.
  const sections = useMemo(() => {
    if (q) {
      return CATEGORIES.map((c) => ({
        title: c,
        items: CATALOGUE.filter(
          (i) => i.category === c && `${i.name} ${i.subcategory}`.toLowerCase().includes(q),
        ),
      })).filter((s) => s.items.length);
    }
    const subs = sub ? [sub] : SUBCATEGORIES[category];
    return subs
      .map((s) => ({ title: s, items: CATALOGUE.filter((i) => i.category === category && i.subcategory === s) }))
      .filter((s) => s.items.length);
  }, [q, category, sub]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 border-b border-stone-200 text-sm font-medium">
        {(
          [
            ["components", "Components"],
            ["booth", "Booth setup"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 border-b-2 py-2.5 transition ${tab === id ? "border-stone-900 text-stone-900" : "border-transparent text-stone-500 hover:text-stone-800"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "booth" ? (
        <div className="flex-1 overflow-y-auto p-3">
          <BoothSetup />
        </div>
      ) : (
        <>
          <div className="shrink-0 space-y-2 border-b border-stone-100 p-3">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-2.5 text-stone-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search all components"
                className="h-9 w-full rounded-full border border-stone-300 bg-stone-50 pl-9 pr-3 text-sm outline-none focus:border-stone-900 focus:bg-white"
              />
            </div>
            {!q && (
              <>
                <CategoryDropdown
                  value={category}
                  onChange={(c) => {
                    setCategory(c);
                    setSub(null);
                  }}
                />
                <div className="-mx-3 flex gap-1.5 overflow-x-auto px-3 pb-0.5 [scrollbar-width:none]">
                  {[null, ...SUBCATEGORIES[category]].map((s) => {
                    const count = CATALOGUE.filter((i) => i.category === category && (!s || i.subcategory === s)).length;
                    if (!count) return null;
                    const selected = sub === s;
                    return (
                      <button
                        key={s ?? "all"}
                        onClick={() => setSub(s)}
                        className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition ${
                          selected ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 text-stone-700 hover:border-stone-500"
                        }`}
                      >
                        {s ?? "All"} <span className={selected ? "text-white/60" : "text-stone-400"}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {sections.length === 0 && <p className="py-8 text-center text-sm text-stone-500">No components match “{query}”.</p>}
            {sections.map((section) => (
              <section key={section.title} className="mb-4">
                <h3 className="mb-2 text-xs font-semibold text-stone-500">{section.title}</h3>
                <div className={`grid gap-2 ${touch ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-2"}`}>
                  {section.items.map((item) => (
                    <ProductCard key={item.id} item={item} onAdd={add} draggable={!touch} />
                  ))}
                </div>
              </section>
            ))}
            {!touch && <p className="pb-2 text-center text-[11px] text-stone-400">Click to add, or drag onto the floor plan.</p>}
          </div>
        </>
      )}
    </div>
  );
}
