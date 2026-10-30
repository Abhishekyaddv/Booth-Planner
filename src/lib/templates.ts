import { nanoid } from "nanoid";
import type { DesignDocument, Envelope, Instance } from "@/types/design";
import { getComponent } from "./catalogue";

/**
 * Create an instance from a catalogue entry. Rotation 0 means the item faces the
 * front of the booth (+y). Sizes and colour come from the catalogue unless overridden.
 */
export function makeInstance(
  componentId: string,
  x: number,
  y: number,
  rotation = 0,
  overrides: Partial<Pick<Instance, "width" | "depth" | "height" | "color">> = {},
): Instance {
  const comp = getComponent(componentId);
  if (!comp) throw new Error(`Unknown component: ${componentId}`);
  return {
    id: nanoid(8),
    componentId,
    x,
    y,
    rotation,
    width: comp.width,
    depth: comp.depth,
    height: comp.height,
    color: comp.defaultColor,
    ...overrides,
  };
}

export const DEFAULT_ENVELOPE: Envelope = {
  width: 3,
  depth: 3,
  height: 2.5,
  openSides: { front: true, back: false, left: false, right: false },
};

export interface Template {
  id: string;
  name: string;
  description: string;
  build: () => DesignDocument;
}

export const TEMPLATES: Template[] = [
  {
    id: "inline-3x3",
    name: "Inline shell 3 × 3 m",
    description: "One open side. Counter, screen and display shelf.",
    build: () => ({
      envelope: { ...DEFAULT_ENVELOPE, openSides: { front: true, back: false, left: false, right: false } },
      instances: [
        makeInstance("flooring", 1.5, 1.5, 0, { width: 3, depth: 3 }),
        makeInstance("fascia", 1.5, 2.975, 0, { width: 3 }),
        makeInstance("media-cabinet", 1.0, 0.225),
        makeInstance("tv-screen", 1.0, 0.225),
        makeInstance("display-shelf", 2.5, 0.175),
        makeInstance("reception-counter", 1.1, 2.25),
        makeInstance("bar-stool", 1.1, 1.6, 180),
        makeInstance("desk-plant", 1.55, 2.25),
        makeInstance("tall-plant", 2.6, 2.6),
      ],
    }),
  },
  {
    id: "corner-6x3",
    name: "Corner booth 6 × 3 m",
    description: "Open front and right. Meeting area and storage.",
    build: () => ({
      envelope: { width: 6, depth: 3, height: 2.5, openSides: { front: true, back: false, left: false, right: true } },
      instances: [
        makeInstance("flooring", 3, 1.5, 0, { width: 6, depth: 3, color: "#64748b" }),
        makeInstance("fascia", 3, 2.975, 0, { width: 6 }),
        makeInstance("fascia", 5.975, 1.5, 90, { width: 3 }),
        makeInstance("storage-room", 0.6, 0.6, 0, { width: 1.2, depth: 1.2 }),
        makeInstance("media-cabinet", 2.6, 0.225),
        makeInstance("tv-screen", 2.6, 0.225),
        makeInstance("display-shelf", 4.0, 0.175),
        makeInstance("display-shelf", 4.9, 0.175),
        makeInstance("meeting-table", 2.25, 1.6),
        makeInstance("chair-modern", 1.75, 0.9),
        makeInstance("chair-modern", 2.75, 0.9),
        makeInstance("chair-modern", 1.75, 2.3, 180),
        makeInstance("chair-modern", 2.75, 2.3, 180),
        makeInstance("reception-counter", 4.9, 2.5),
        makeInstance("bar-stool", 4.9, 1.85, 180),
        makeInstance("tall-plant", 0.35, 2.65),
      ],
    }),
  },
  {
    id: "island-6x6",
    name: "Island booth 6 × 6 m",
    description: "Open on all four sides with a central core.",
    build: () => ({
      envelope: { width: 6, depth: 6, height: 2.5, openSides: { front: true, back: true, left: true, right: true } },
      instances: [
        makeInstance("flooring", 3, 3, 0, { width: 6, depth: 6, color: "#475569" }),
        makeInstance("storage-room", 3, 3, 0, { width: 1.5, depth: 1.5 }),
        makeInstance("display-shelf", 2.6, 2.05, 180),
        makeInstance("display-shelf", 3.4, 2.05, 180),
        makeInstance("reception-counter", 3, 5.25),
        makeInstance("desk-plant", 3.4, 5.25),
        makeInstance("reception-counter", 3, 0.75, 180),
        makeInstance("rug", 1.25, 4.65, 0, { width: 2, depth: 2 }),
        makeInstance("sofa", 1.25, 3.95),
        makeInstance("coffee-table", 1.25, 4.8),
        makeInstance("lounge-chair", 1.25, 5.55, 180),
        makeInstance("round-table", 4.75, 1.4),
        makeInstance("chair", 4.75, 0.7),
        makeInstance("chair", 4.75, 2.1, 180),
        makeInstance("chair", 4.05, 1.4, 270),
        makeInstance("chair", 5.45, 1.4, 90),
        makeInstance("media-cabinet", 4.75, 5.55),
        makeInstance("tv-screen", 4.75, 5.55),
        makeInstance("tall-plant", 0.35, 0.35),
        makeInstance("tall-plant", 5.65, 3.6),
      ],
    }),
  },
];

export function emptyDesign(envelope: Envelope = DEFAULT_ENVELOPE): DesignDocument {
  return { envelope: structuredClone(envelope), instances: [] };
}
