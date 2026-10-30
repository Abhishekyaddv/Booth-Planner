"use client";

import { useEffect, useRef, useState } from "react";
import type { Category } from "@/types/design";
import { CATALOGUE, CATEGORIES } from "@/lib/catalogue";
import { isoUrl } from "@/lib/assets";
import { ChevronIcon } from "@/components/ui/icons";

/** One representative picture per category, shown in the dropdown. */
const CATEGORY_ICON: Record<Category, string | null> = {
  Structure: null,
  Counters: "desk",
  Seating: "loungeChair",
  Tables: "table",
  "Displays & Screens": "televisionModern",
  Decor: "pottedPlant",
};

const COUNTS = Object.fromEntries(
  CATEGORIES.map((c) => [c, CATALOGUE.filter((i) => i.category === c).length]),
) as Record<Category, number>;

interface Props {
  value: Category;
  onChange: (c: Category) => void;
}

/** IKEA-style category picker: a full-width button that opens a list of categories. */
export function CategoryDropdown({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  const openMenu = () => {
    setActive(CATEGORIES.indexOf(value));
    setOpen(true);
  };

  const choose = (c: Category) => {
    onChange(c);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
    else if (e.key === "ArrowDown") setActive((a) => (a + 1) % CATEGORIES.length);
    else if (e.key === "ArrowUp") setActive((a) => (a - 1 + CATEGORIES.length) % CATEGORIES.length);
    else if (e.key === "Enter" || e.key === " ") choose(CATEGORIES[active]);
    else return;
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className="flex h-12 w-full items-center gap-3 rounded-lg border border-stone-300 bg-white px-3 text-left transition hover:border-stone-500"
      >
        <CategoryIcon category={value} />
        <span className="flex-1">
          <span className="block text-sm font-semibold text-stone-900">{value}</span>
          <span className="block text-[11px] text-stone-500">{COUNTS[value]} items</span>
        </span>
        <ChevronIcon className={`text-stone-500 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          aria-activedescendant={`cat-${active}`}
          onKeyDown={onKeyDown}
          className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-stone-200 bg-white py-1 shadow-lg outline-none"
        >
          {CATEGORIES.map((c, i) => (
            <li
              key={c}
              id={`cat-${i}`}
              role="option"
              aria-selected={c === value}
              onPointerEnter={() => setActive(i)}
              onClick={() => choose(c)}
              className={`flex cursor-pointer items-center gap-3 px-3 py-2 text-sm ${i === active ? "bg-stone-100" : ""}`}
            >
              <CategoryIcon category={c} />
              <span className={`flex-1 ${c === value ? "font-semibold text-stone-900" : "text-stone-700"}`}>{c}</span>
              <span className="text-xs tabular-nums text-stone-400">{COUNTS[c]}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CategoryIcon({ category }: { category: Category }) {
  const key = CATEGORY_ICON[category];
  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-stone-100">
      {key ? (
        // eslint-disable-next-line @next/next/no-img-element -- tiny pre-optimised WebP
        <img src={isoUrl(key, "SW")} alt="" width={28} height={28} decoding="async" className="h-7 w-7 object-contain" />
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-stone-500">
          <path d="M3 21V8l9-5 9 5v13" />
          <path d="M3 21h18M9 21v-7h6v7" />
        </svg>
      )}
    </span>
  );
}
