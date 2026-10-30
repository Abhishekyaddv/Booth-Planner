"use client";

import { useMemo } from "react";
import { useDesignStore } from "./designStore";
import { validate } from "@/lib/rules";

/** Validation results for the current design, recomputed only when the design changes. */
export function useIssues() {
  const design = useDesignStore((s) => s.design);
  return useMemo(() => validate(design), [design]);
}

export function useSelectedInstance() {
  return useDesignStore((s) => s.design.instances.find((i) => i.id === s.selectedId) ?? null);
}
