import type { CatalogueItem, DesignDocument, Instance } from "@/types/design";
import { getComponent, layerOf } from "./catalogue";
import { corners, halfExtents, pointInPolygon, polygonsOverlap, round } from "./geometry";

export type Issue =
  | { type: "outside" }
  | { type: "overlap"; withId: string };

export type IssueMap = Record<string, Issue[]>;

const EPS = 1e-3;

/** Can these two items share floor space? (rugs, flooring, a screen on a counter...) */
function mayShareSpace(a: CatalogueItem | undefined, b: CatalogueItem | undefined) {
  if (layerOf(a) !== "object" || layerOf(b) !== "object") return true;
  if (a?.onSurface && b?.surface) return true;
  if (b?.onSurface && a?.surface) return true;
  return false;
}

export function isOutside(inst: Instance, design: DesignDocument) {
  const { width, depth } = design.envelope;
  return corners(inst).some(
    (p) => p.x < -EPS || p.y < -EPS || p.x > width + EPS || p.y > depth + EPS,
  );
}

/** Pure validation: returns the issues for every instance that has at least one. */
export function validate(design: DesignDocument): IssueMap {
  const issues: IssueMap = {};
  const add = (id: string, issue: Issue) => (issues[id] ??= []).push(issue);
  const items = design.instances.map((inst) => ({
    inst,
    comp: getComponent(inst.componentId),
    poly: corners(inst),
  }));

  for (const { inst } of items) {
    if (isOutside(inst, design)) add(inst.id, { type: "outside" });
  }

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i];
      const b = items[j];
      if (mayShareSpace(a.comp, b.comp)) continue;
      if (polygonsOverlap(a.poly, b.poly)) {
        add(a.inst.id, { type: "overlap", withId: b.inst.id });
        add(b.inst.id, { type: "overlap", withId: a.inst.id });
      }
    }
  }
  return issues;
}

export function describeIssue(issue: Issue, design: DesignDocument) {
  if (issue.type === "outside") return "Extends outside the booth";
  const other = design.instances.find((i) => i.id === issue.withId);
  const name = other ? getComponent(other.componentId)?.name ?? "another item" : "another item";
  return `Overlaps ${name}`;
}

/** Stacking order on the floor: flooring, then platforms, then rugs, then furniture. */
function stackRank(inst: Instance) {
  if (inst.componentId === "flooring") return 0;
  if (inst.componentId === "platform") return 1;
  return layerOf(getComponent(inst.componentId)) === "floor" ? 2 : 3;
}

/**
 * Height an item stands at in 3D: on top of any flooring, platform or rug under
 * its centre, and, for small items, on top of the counter/table it is placed on.
 */
export function baseElevation(inst: Instance, design: DesignDocument, depth = 0): number {
  const comp = getComponent(inst.componentId);
  if (layerOf(comp) === "overhead") return design.envelope.height;
  if (depth > 4) return 0;
  const centre = { x: inst.x, y: inst.y };
  const rank = stackRank(inst);
  let base = 0;
  for (const other of design.instances) {
    if (other.id === inst.id) continue;
    const below =
      stackRank(other) < rank || (comp?.onSurface && getComponent(other.componentId)?.surface);
    if (!below || !pointInPolygon(centre, corners(other))) continue;
    base = Math.max(base, baseElevation(other, design, depth + 1) + other.height);
  }
  return base;
}

/** Find a free spot for a new item, scanning from the back of the booth. Falls back to the centre. */
export function findFreeSpot(
  design: DesignDocument,
  comp: CatalogueItem,
  size: Pick<Instance, "width" | "depth" | "rotation">,
): { x: number; y: number } {
  const { width: W, depth: D } = design.envelope;
  const { hx, hy } = halfExtents(size);
  const step = 0.25;
  const others = design.instances
    .filter((o) => !mayShareSpace(comp, getComponent(o.componentId)))
    .map((o) => corners(o));
  if (layerOf(comp) === "object") {
    for (let y = hy; y <= D - hy + EPS; y += step) {
      for (let x = hx; x <= W - hx + EPS; x += step) {
        const poly = corners({ ...size, x, y });
        if (!others.some((o) => polygonsOverlap(poly, o))) return { x: round(x), y: round(y) };
      }
    }
  }
  return { x: round(W / 2), y: round(D / 2) };
}
