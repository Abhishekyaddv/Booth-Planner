"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * Mobile bottom sheet (IKEA-planner style). Opens at about half height; tap or
 * drag the handle up for full height, drag it down or tap the backdrop to close.
 * Stays mounted while closed so its scroll position and tab are kept.
 */
export function BottomSheet({ open, onClose, title, children }: Props) {
  const [full, setFull] = useState(false);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const close = () => {
    setFull(false);
    onClose();
  };

  const onPointerDown = (e: React.PointerEvent) => {
    start.current = e.clientY;
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (start.current !== null) setDrag(e.clientY - start.current);
  };
  const onPointerUp = () => {
    if (start.current === null) return;
    if (drag > 90) close();
    else if (drag < -50) setFull(true);
    else if (Math.abs(drag) < 5) setFull((f) => !f); // tap on the handle toggles height
    start.current = null;
    setDragging(false);
    setDrag(0);
  };

  return (
    <div className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open} inert={!open}>
      <div onClick={close} className={`absolute inset-0 bg-black/30 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`} />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute inset-x-0 bottom-0 flex flex-col rounded-t-2xl bg-white shadow-2xl transition-[transform,height] duration-200 ease-out"
        style={{
          height: full ? "92dvh" : "62dvh",
          transform: open ? `translateY(${Math.max(0, drag)}px)` : "translateY(100%)",
          transitionDuration: dragging ? "0ms" : undefined, // follow the finger while dragging
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="flex shrink-0 cursor-grab touch-none flex-col items-center gap-1 pb-1 pt-2"
        >
          <span className="h-1.5 w-10 rounded-full bg-stone-300" />
          <div className="flex w-full items-center justify-between px-4">
            <h2 className="text-sm font-semibold text-stone-900">{title}</h2>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={close}
              className="grid h-8 w-8 place-items-center rounded-full text-stone-500 hover:bg-stone-100"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </section>
    </div>
  );
}
