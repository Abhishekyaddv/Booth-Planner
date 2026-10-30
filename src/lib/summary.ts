import type { Envelope } from "@/types/design";

/** Industry name for a booth based on how many sides are open to the aisle. */
export function boothType(env: Envelope) {
  const { front, back, left, right } = env.openSides;
  const open = [front, back, left, right].filter(Boolean).length;
  if (open === 0) return "Closed";
  if (open === 1) return "Inline";
  if (open === 3) return "Peninsula";
  if (open === 4) return "Island";
  return (front && back) || (left && right) ? "Through" : "Corner";
}

export const formatM = (v: number) => `${Number(v.toFixed(2))} m`;
